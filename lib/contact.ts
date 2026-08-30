// lib/contact.ts
// Single source of truth for the public-site contact strings read from the
// `Setting` table.
//
// Same two-layer caching pattern as `lib/brand.ts`:
//   • outer `react.cache`  → per-request dedup (Footer + contact page in one request)
//   • inner `unstable_cache` → cross-request persistence, tag `settings:contact.email`
// Admin settings mutations call `revalidateTag('settings:contact.email')`
// (via settingsTag in modules/settings/server) to invalidate immediately.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cachedGetSetting, settingsTag } from '@/modules/settings/server';

const DEFAULT_CONTACT_EMAIL = 'hello@9ent.vn';

export const getContactEmail = cache((): Promise<string> =>
  unstable_cache(
    async () => {
      const raw = await cachedGetSetting('contact.email');
      return raw?.trim() || DEFAULT_CONTACT_EMAIL;
    },
    ['contact-email'],
    { tags: [settingsTag('contact.email')], revalidate: 600 }
  )()
);
