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

export type Brand = {
  siteName: string;
  tagline: string;
  taglineLong: string;
};

export const getBrand = cache((): Promise<Brand> =>
  unstable_cache(
    async () => {
      const [name, tagline] = await Promise.all([
        cachedGetSetting('site.name'),
        cachedGetSetting('site.tagline')
      ]);
      return {
        siteName: name?.trim() || DEFAULT_SITE_NAME,
        tagline: tagline?.trim() || DEFAULT_TAGLINE,
        taglineLong:
          tagline?.trim() ||
          'Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi làm việc.'
      };
    },
    ['brand'],
    { tags: [BRAND_TAG], revalidate: 600 }
  )()
);

export { BRAND_TAG };
