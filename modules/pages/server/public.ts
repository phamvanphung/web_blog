// modules/pages/server/public.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { reviveDates } from '@/lib/cache/revive';

// Outer `cache` (per-request dedup) + inner `unstable_cache` (persistence, tag `pages:detail:<slug>`).
// `reviveDates` runs on the unwrapped result so cache hits — which deserialise
// ISO strings without restoring `Date` prototypes — are restored to real Dates.
export const getPublishedPageBySlug = cache((slug: string) =>
  unstable_cache(
    async () => {
      const page = await db.page.findUnique({ where: { slug } });
      if (!page || page.status !== 'PUBLISHED') return null;
      return page;
    },
    ['page:detail', slug],
    { tags: [`pages:detail:${slug}`], revalidate: 300 }
  )().then((data) => reviveDates(data))
);

async function listPublishedPagesUncached() {
  return db.page.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, updatedAt: true }
  });
}

/** Cached page list. Tag `pages:list`. */
export function listPublishedPages() {
  return unstable_cache(
    async () => listPublishedPagesUncached(),
    ['pages:list'],
    { tags: ['pages:list'], revalidate: 300 }
  )().then((data) => reviveDates(data));
}
