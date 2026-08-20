// modules/categories/server/public.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { reviveDates } from '@/lib/cache/revive';

// Outer `cache` (per-request dedup for generateMetadata + body).
// Inner `unstable_cache` (cross-request persistence, tagged `categories:detail:<slug>`).
// `reviveDates` runs on the unwrapped result so cache hits — which deserialise
// ISO strings without restoring `Date` prototypes — are restored to real Dates.
export const getCategoryBySlug = cache((slug: string) =>
  unstable_cache(
    async () => db.category.findFirst({ where: { slug, hidden: false } }),
    ['category:detail', slug],
    { tags: [`categories:detail:${slug}`], revalidate: 300 }
  )().then((data) => reviveDates(data))
);

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export async function listCategoriesByGroupSlug(
  groupSlug: string,
  limit: number,
  orderBy: 'sortOrder' | 'name'
): Promise<PublicCategory[]> {
  const group = await db.categoryGroup.findUnique({
    where: { slug: groupSlug },
    select: { id: true }
  });
  if (!group) return [];

  const where =
    groupSlug === 'default'
      ? { hidden: false, OR: [{ groupId: group.id }, { groupId: null }] }
      : { groupId: group.id, hidden: false };

  const orderByClause: Array<{ name: 'asc' | 'desc' } | { sortOrder: 'asc' | 'desc' }> =
    orderBy === 'name'
      ? [{ name: 'asc' }, { sortOrder: 'asc' }]
      : [{ sortOrder: 'asc' }, { name: 'asc' }];

  return db.category.findMany({
    where,
    orderBy: orderByClause,
    take: limit,
    select: { id: true, name: true, slug: true, description: true }
  });
}

async function listCategoriesWithCountsUncached() {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          posts: {
            where: { post: { status: 'PUBLISHED', deletedAt: null } }
          }
        }
      }
    }
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    count: c._count.posts
  }));
}

/** Cached category list with post counts. Tag `categories:list`. */
export function listCategoriesWithCounts() {
  return unstable_cache(
    async () => listCategoriesWithCountsUncached(),
    ['categories:list'],
    { tags: ['categories:list'], revalidate: 300 }
  )().then((data) => reviveDates(data));
}
