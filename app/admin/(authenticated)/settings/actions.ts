'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { requireRole } from '@/lib/auth';
import { upsertSetting, BRAND_TAG, settingsTag } from '@/modules/settings/server';

const SettingUpdate = z.object({
  key: z.string().min(1).max(80),
  value: z.string().max(2000)
});

// Per-key validation schemas. Map keys to stricter shapes than the generic
// SettingUpdate (which only bounds length). The runtime dispatcher picks the
// strictest applicable schema; keys not listed here fall back to SettingUpdate.
const KEY_SCHEMAS: Record<string, z.ZodType<string>> = {
  'chat.zaloPhone': z
    .string()
    .trim()
    .max(20)
    .regex(/^[\d\s\-+()]*$/, 'Chỉ chứa chữ số và dấu + - ( ) khoảng trắng'),
  'chat.messengerPageId': z
    .string()
    .trim()
    .regex(/^\d{6,30}$/, 'Page ID phải là số, 6-30 chữ số'),
  'chat.floatingEnabled': z.enum(['true', 'false'])
};

export type SettingFormState = { ok: true } | { ok: false; error: string };

export async function updateSettingAction(
  _prev: SettingFormState | undefined,
  formData: FormData
): Promise<SettingFormState> {
  const me = await requireRole('ADMIN');

  const key = String(formData.get('key') ?? '');
  const value = String(formData.get('value') ?? '');

  // Generic length check first (cheap, runs on every key).
  const baseParsed = SettingUpdate.safeParse({ key, value });
  if (!baseParsed.success) {
    return { ok: false, error: 'Key/value không hợp lệ (key 1–80 chars, value ≤ 2000 chars).' };
  }

  // Per-key stricter validation if a schema is registered. Empty value
  // is allowed (admin clearing a key); only non-empty values are validated.
  const strict = KEY_SCHEMAS[key];
  if (strict && value.trim().length > 0) {
    const strictParsed = strict.safeParse(value);
    if (!strictParsed.success) {
      const issue = strictParsed.error.issues[0]?.message ?? 'Giá trị không hợp lệ';
      return { ok: false, error: issue };
    }
  }

  const parsed = baseParsed;

  await upsertSetting(parsed.data.key, parsed.data.value);

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'setting.update',
    target: 'Setting',
    targetId: parsed.data.key,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/settings');
  // Brand keys ('site.*') drive header/footer; invalidate `settings:brand`
  // alongside the per-key tag so both the bundled brand cache and any
  // individual getSetting cached reads refresh.
  revalidateTag(settingsTag(parsed.data.key));
  if (parsed.data.key.startsWith('site.')) revalidateTag(BRAND_TAG);
  // `site.homeHref` is also read by the root-path middleware
  // (`/middleware.ts`) which keeps its own in-process cache with a
  // 1 s TTL. Cache invalidation across workers isn't possible from
  // here (the cache lives in the Edge worker's memory) but the TTL
  // is short enough that an admin who refreshes `/` after saving
  // sees the new redirect target within a second. The brand cache
  // above is what actually drives the visible logo / wordmark link
  // in the header, so re-invalidating it is the user-visible half
  // of the equation.
  return { ok: true };
}
