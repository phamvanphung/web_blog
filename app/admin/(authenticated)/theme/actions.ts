'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { requireRole } from '@/lib/auth';
import { upsertSetting } from '@/modules/settings/server';
import { THEME_KEYS, type ThemeKey } from '@/modules/settings/types';
import { HEX_REGEX, THEME_TAG } from '@/lib/theme';

const HEX = z.string().regex(HEX_REGEX, 'Mã hex không hợp lệ (vd: #8e211c)');

const ThemeSaveSchema = z.object({
  values: z.record(z.string(), HEX)
});

export type ThemeFormState = { ok: true } | { ok: false; error: string };

/**
 * Save all 8 theme keys atomically. We don't wrap in a transaction because
 * `Setting.upsert` is idempotent and a partial failure is acceptable
 * (admin re-saves → next attempt completes the rest). Atomicity matters
 * only for the audit row, which we write once after all upserts.
 */
export async function saveThemeAction(
  _prev: ThemeFormState | undefined,
  formData: FormData
): Promise<ThemeFormState> {
  const me = await requireRole('ADMIN');

  // Build a `Record<ThemeKey, string>` from the FormData. Each row's
  // <input name="theme.<key>"> contributes one entry.
  const values: Record<string, string> = {};
  for (const key of THEME_KEYS) {
    const raw = formData.get(key);
    if (typeof raw !== 'string' || raw.length === 0) {
      return { ok: false, error: `Thiếu giá trị cho "${key}".` };
    }
    values[key] = raw;
  }

  const parsed = ThemeSaveSchema.safeParse({ values });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.';
    return { ok: false, error: first };
  }

  for (const key of THEME_KEYS) {
    await upsertSetting(key as ThemeKey, parsed.data.values[key as ThemeKey]!);
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'theme.update',
    target: 'Theme',
    targetId: 'all',
    metadata: { keys: THEME_KEYS as unknown as string[] },
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/theme');
  revalidateTag(THEME_TAG);
  // Per-key tags too (in case anything reads individual theme.* via cachedGetSetting).
  for (const key of THEME_KEYS) {
    revalidateTag(`settings:${key}`);
  }
  return { ok: true };
}

/**
 * Reset all 8 theme keys back to the hex defaults shipped in tokens.css.
 * Uses `DEFAULT_THEME_HEX` as the source of truth so the DB and tokens.css
 * never drift — same file (`lib/theme.ts`) backs both seed and reset.
 * Signature matches `useActionState` shape — `_prev` and `_formData` are
 * ignored because reset pulls from `DEFAULT_THEME_HEX`, not form input.
 */
export async function resetThemeAction(
  _prev: ThemeFormState | undefined,
  _formData: FormData
): Promise<ThemeFormState> {
  const me = await requireRole('ADMIN');

  const { DEFAULT_THEME_HEX } = await import('@/lib/theme');

  for (const key of THEME_KEYS) {
    await upsertSetting(key as ThemeKey, DEFAULT_THEME_HEX[key]);
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'theme.reset',
    target: 'Theme',
    targetId: 'all',
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/theme');
  revalidateTag(THEME_TAG);
  for (const key of THEME_KEYS) {
    revalidateTag(`settings:${key}`);
  }
  return { ok: true };
}
