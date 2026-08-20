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

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

/**
 * List visible (hidden=false) categories belonging to a group (by slug).
 * Special case: `slug === 'default'` also matches categories with
 * `groupId IS NULL` (legacy data) — they are conceptually in the default group.
 * Returns [] if the group slug doesn't exist (caller can decide to render null).
 *
 * Args are primitive (not object) so React's per-request `cache()` can dedup
 * calls by reference identity — matching the `getCategoryBySlug` pattern.
 */
export const listCategoriesByGroupSlug = cache(
  (groupSlug: string, limit: number, orderBy: 'sortOrder' | 'name') =>
    unstable_cache(
      async () => {
        const group = await db.categoryGroup.findUnique({ where: { slug: groupSlug } });
        const groupId = group?.id ?? null;

        const where =
          groupSlug === 'default'
            ? { hidden: false, OR: [{ groupId: null }, ...(groupId ? [{ groupId }] : [])] }
            : groupId
              ? { hidden: false, groupId }
              : { hidden: false, groupId: '__no_match__' };

        const rows = await db.category.findMany({
          where,
          orderBy:
            orderBy === 'name'
              ? [{ name: 'asc' }]
              : [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: limit,
          select: { id: true, name: true, slug: true, description: true }
        });
        return rows;
      },
      ['categories:by-group', groupSlug, String(limit), orderBy],
      { tags: [`categories:by-group:${groupSlug}`], revalidate: 300 }
    )().then((data) => reviveDates(data))
);

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
