'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { requireRole } from '@/lib/auth';
import { upsertSetting } from '@/modules/settings/server';

const SettingUpdate = z.object({
  key: z.string().min(1).max(80),
  value: z.string().max(2000)
});

export async function updateSettingAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');

  const parsed = SettingUpdate.safeParse({
    key: String(formData.get('key') ?? ''),
    value: String(formData.get('value') ?? '')
  });
  if (!parsed.success) return;

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
}
