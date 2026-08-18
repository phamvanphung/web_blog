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

export type SettingFormState = { ok: true } | { ok: false; error: string };

export async function updateSettingAction(
  _prev: SettingFormState | undefined,
  formData: FormData
): Promise<SettingFormState> {
  const me = await requireRole('ADMIN');

  const parsed = SettingUpdate.safeParse({
    key: String(formData.get('key') ?? ''),
    value: String(formData.get('value') ?? '')
  });
  if (!parsed.success) {
    return { ok: false, error: 'Key/value không hợp lệ (key 1–80 chars, value ≤ 2000 chars).' };
  }

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
  return { ok: true };
}
