// lib/brand.ts
// Single source of truth for the public-site brand strings read from the
// `Setting` table.
//
// Two-layer caching:
//   • outer `react.cache`  → per-request dedup (layout + page in one request)
//   • inner `unstable_cache` → cross-request persistence, tag `settings:brand`
// Admin settings mutations call `revalidateTag('settings:brand')` (via
// BRAND_TAG) to invalidate immediately.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cachedGetSetting, BRAND_TAG } from '@/modules/settings/server';

const DEFAULT_SITE_NAME = '9ent';
const DEFAULT_TAGLINE = 'Blog công ty 9ent';
const DEFAULT_HOME_HREF = '/';

export type Brand = {
  siteName: string;
  tagline: string;
  taglineLong: string;
  /** Logo / wordmark link target. Falls back to `/` if not configured. */
  homeHref: string;
};

/**
 * Resolve the configured home URL, defaulting to `/` when the
 * `site.homeHref` setting is empty or missing. Trimmed; relative
 * paths are accepted (`/` or `/landing`), absolute URLs are not
 * validated here — admin is trusted to paste a usable value.
 */
export async function getHomeHref(): Promise<string> {
  const raw = await cachedGetSetting('site.homeHref');
  const trimmed = raw?.trim();
  return trimmed || DEFAULT_HOME_HREF;
}

export const getBrand = cache((): Promise<Brand> =>
  unstable_cache(
    async () => {
      const [name, tagline, homeHref] = await Promise.all([
        cachedGetSetting('site.name'),
        cachedGetSetting('site.tagline'),
        cachedGetSetting('site.homeHref')
      ]);
      return {
        siteName: name?.trim() || DEFAULT_SITE_NAME,
        tagline: tagline?.trim() || DEFAULT_TAGLINE,
        taglineLong:
          tagline?.trim() ||
          'Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi làm việc.',
        homeHref: homeHref?.trim() || DEFAULT_HOME_HREF
      };
    },
    ['brand'],
    { tags: [BRAND_TAG], revalidate: 600 }
  )()
);

/**
 * Raw `site.name` without any default fallback. Returns an empty string when
 * the setting is missing — used by the Header so the logo area can render
 * blank (per design intent) instead of silently substituting "9ent".
 *
 * Footer / metadata still get the "9ent" default via `getBrand().siteName`.
 * Shares `BRAND_TAG` so admin updates to `site.name` invalidate both caches.
 */
export const getSiteName = cache((): Promise<string> =>
  unstable_cache(
    async () => (await cachedGetSetting('site.name'))?.trim() ?? '',
    ['site-name'],
    { tags: [BRAND_TAG], revalidate: 600 }
  )()
);

export { BRAND_TAG };
