// lib/brand.ts
// Single source of truth for the public-site brand strings read from the
// `Setting` table. Cached per request via React.cache so layout + page don't
// hit the DB twice.

import { cache } from 'react';
import { getSetting } from '@/modules/settings/server';

const DEFAULT_SITE_NAME = '9ent';
const DEFAULT_TAGLINE = 'Blog công ty 9ent';

export type Brand = {
  siteName: string;
  tagline: string;
  taglineLong: string;
};

/**
 * Read the public brand strings. Always returns a value — falls back to
 * canonical defaults when the DB row is missing (e.g. fresh install before
 * the user edits /admin/settings).
 */
export const getBrand = cache(async (): Promise<Brand> => {
  const [name, tagline] = await Promise.all([
    getSetting('site.name'),
    getSetting('site.tagline')
  ]);
  return {
    siteName: name?.trim() || DEFAULT_SITE_NAME,
    tagline: tagline?.trim() || DEFAULT_TAGLINE,
    taglineLong:
      tagline?.trim() ||
      'Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi làm việc.'
  };
});
