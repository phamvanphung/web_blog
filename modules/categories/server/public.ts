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
    async () => db.category.findUnique({ where: { slug } }),
    ['category:detail', slug],
    { tags: [`categories:detail:${slug}`], revalidate: 300 }
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
