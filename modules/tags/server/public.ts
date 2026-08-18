// modules/tags/server/public.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

// Outer `cache` (per-request dedup) + inner `unstable_cache` (persistence, tag `tags:detail:<slug>`).
export const getTagBySlug = cache((slug: string) =>
  unstable_cache(
    async () => db.tag.findUnique({ where: { slug } }),
    ['tag:detail', slug],
    { tags: [`tags:detail:${slug}`], revalidate: 300 }
  )()
);

async function listTagsWithCountsUncached() {
  const rows = await db.tag.findMany({
    orderBy: { name: 'asc' },
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
  return rows
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.posts }))
    .filter((t) => t.count > 0);
}

/** Cached tag list with post counts (>0). Tag `tags:list`. */
export function listTagsWithCounts() {
  return unstable_cache(
    () => listTagsWithCountsUncached(),
    ['tags:list'],
    { tags: ['tags:list'], revalidate: 300 }
  )();
}
