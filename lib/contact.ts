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
import { cachedGetSetting, cachedGetSettings, settingsTag } from '@/modules/settings/server';

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

export type ContactChannels = {
  /** Raw Zalo phone string (digits-only after buildZaloUrl strips non-digits). */
  zaloPhone: string | null;
  /** Messenger Page ID (digits-only). */
  messengerPageId: string | null;
  /**
   * Whether the floating widget bottom-right should render. Default ON
   * when unset so admin who has never touched this still gets the
   * widget once they configure at least one chat ID.
   */
  floatingEnabled: boolean;
};

/**
 * Read all 3 chat-channel settings in a single `findMany` (Phase B's
 * cachedGetSettings batches the keys). Same two-layer cache pattern as
 * getContactEmail: outer `react.cache` for per-request dedup, inner
 * `unstable_cache` for cross-request persistence tagged with per-key
 * settingsTag so admin writes via updateSettingAction auto-invalidate.
 */
export const getContactChannels = cache(
  (): Promise<ContactChannels> =>
    unstable_cache(
      async () => {
        const rows = await cachedGetSettings('chat', [
          'chat.zaloPhone',
          'chat.messengerPageId',
          'chat.floatingEnabled'
        ] as const);
        return {
          zaloPhone: rows['chat.zaloPhone']?.trim() || null,
          messengerPageId: rows['chat.messengerPageId']?.trim() || null,
          floatingEnabled:
            rows['chat.floatingEnabled']?.trim().toLowerCase() !== 'false'
        };
      },
      ['contact-channels'],
      {
        tags: [
          settingsTag('chat.zaloPhone'),
          settingsTag('chat.messengerPageId'),
          settingsTag('chat.floatingEnabled')
        ],
        revalidate: 600
      }
    )()
);
