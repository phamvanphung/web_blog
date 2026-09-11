// modules/settings/server/index.ts
// Key-value settings backed by the Setting table. Centralised so P5+
// (public site) can read the same source of truth.

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { type SettingKey, type SettingsMap } from '@/modules/settings/types';

export async function getSetting<K extends SettingKey>(key: K): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

/**
 * Cached variant of `getSetting` for hot public reads (brand, footer copy).
 * Tag `settings:<key>` is invalidated by `upsertSetting` callers (admin
 * `/admin/(authenticated)/settings/actions.ts` pairs every write with the
 * matching `revalidateTag`).
 */
export function cachedGetSetting<K extends string>(key: K) {
  return unstable_cache(
    async () => {
      const row = await db.setting.findUnique({ where: { key } });
      return row?.value ?? null;
    },
    ['setting', key],
    { tags: [`settings:${key}`], revalidate: 600 }
  )() as Promise<string | null>;
}

/**
 * Batched variant of `cachedGetSetting` for hot reads that always need the
 * same group of keys (brand, theme). ONE `unstable_cache` entry wraps ONE
 * `db.setting.findMany({ where: { key: { in: keys } } })` call — instead of
 * N independent `cachedGetSetting` calls — so a single cache miss acquires
 * one pool connection, not N. This is the fix for the
 * `pool timeout: failed to retrieve a connection` failure mode we saw when
 * `Promise.all` of 8+ `cachedGetSetting` calls fired simultaneously after
 * an admin `revalidateTag`.
 *
 * Tags: group tag (`settings:<group>`) AND every per-key tag, so callers
 * invalidating either path trigger a refresh. Misses default to `null`
 * (not undefined) so call sites can rely on a stable Record shape.
 *
 * Use for groups of 3+ keys read together; for single-key reads prefer
 * `cachedGetSetting` since the `findUnique` path is just as fast and the
 * cache key is simpler to reason about.
 */
export function cachedGetSettings<K extends string>(
  group: string,
  keys: readonly K[]
): Promise<Record<K, string | null>> {
  return unstable_cache(
    async () => {
      const rows = await db.setting.findMany({
        // Spread to a mutable array: `readonly K[]` is not assignable to
        // Prisma's `string[]`, and a cast through `unknown` would lose the
        // key types downstream.
        where: { key: { in: [...keys] } }
      });
      const out: Record<string, string | null> = {};
      for (const k of keys) out[k] = null;
      for (const r of rows) out[r.key] = r.value;
      return out as Record<K, string | null>;
    },
    ['settings-group', group, ...keys],
    {
      tags: [`settings:${group}`, ...keys.map((k) => `settings:${k}`)],
      revalidate: 600
    }
  )() as Promise<Record<K, string | null>>;
}

/** Stable tag prefix for a specific setting key. */
export const settingsTag = (key: string) => `settings:${key}`;
/** Convenience for brand-affecting settings — invalidates any read tagged with `settings:brand`. */
export const BRAND_TAG = 'settings:brand';

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
