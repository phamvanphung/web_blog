// modules/popups/server/public.ts
// Public read: returns popups matching the current pathname.
// Cached via unstable_cache; mutations call revalidateTag(POPUPS_PUBLIC_TAG).

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { reviveDates } from '@/lib/cache/revive';
import { matches } from './match';
import type { SerializedPopup } from '../types';

export const POPUPS_PUBLIC_TAG = 'popups:public';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  htmlContent: true,
  triggerType: true,
  triggerPaths: true,
  frequency: true,
  delaySeconds: true
} as const;

/**
 * Returns the list of popups matching `pathname`.
 *  - Server-only.
 *  - Cache key excludes `pathname` (we cache the full published set and
 *    filter in-memory) so adding/removing a path match doesn't grow the
 *    cache. Single tag invalidation on any mutation.
 */
export async function getActivePopupsForPath(pathname: string): Promise<SerializedPopup[]> {
  const all = await unstable_cache(
    async () =>
      db.popup.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        select: PUBLIC_SELECT,
        orderBy: { createdAt: 'asc' }
      }),
    ['popups:public:all'],
    { tags: [POPUPS_PUBLIC_TAG], revalidate: 60 }
  )();
  return reviveDates(all).filter((p) => matches(p as never, pathname));
}
