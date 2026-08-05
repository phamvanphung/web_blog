// modules/settings/server/index.ts
// Key-value settings backed by the Setting table. Centralised so P5+
// (public site) can read the same source of truth.

import { db } from '@/lib/db';
import { type SettingKey, type SettingsMap } from '@/modules/settings/types';

export async function getSetting<K extends SettingKey>(key: K): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettings<K extends SettingKey>(keys: readonly K[]): Promise<SettingsMap> {
  const rows = await db.setting.findMany({
    // Spread to a mutable array: `readonly K[]` is not assignable to Prisma's
    // `string[]`, and a cast would need to launder through `unknown`.
    where: { key: { in: [...keys] } }
  });
  const out: SettingsMap = {};
  for (const r of rows) out[r.key as K] = r.value;
  return out;
}

export async function listSettings(): Promise<{ key: string; value: string; updatedAt: Date }[]> {
  return db.setting.findMany({ orderBy: { key: 'asc' } });
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}
