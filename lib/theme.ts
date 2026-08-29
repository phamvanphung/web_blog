// lib/theme.ts
// Single source of truth for the public-site brand colors read from the
// `Setting` table. Mirrors the two-layer caching pattern in `lib/brand.ts`:
//   • outer `react.cache`  → per-request dedup
//   • inner `unstable_cache` → cross-request persistence, tag `settings:theme`
//
// Admin theme writes call `revalidateTag('settings:theme')` to invalidate.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cachedGetSetting } from '@/modules/settings/server';
import type { ThemeKey } from '@/modules/settings/types';

export const THEME_TAG = 'settings:theme';

/**
 * The hex values shipped in `styles/tokens.css`. Used as the fallback when
 * a theme.* setting is missing from the DB (first deploy, fresh DB, or
 * admin never opened the theme page). Keep in sync with tokens.css.
 */
export const DEFAULT_THEME_HEX: Record<ThemeKey, string> = {
  'theme.primary': '#8e211c',
  'theme.secondary': '#cf6768',
  'theme.surface.canvas': '#ffffff',
  'theme.surface.warm': '#fff7f7',
  'theme.surface.dark': '#44100f',
  'theme.ink.heading': '#44100f',
  'theme.hairline': '#f0d9d9',
  'theme.badge': '#f5d0d1'
};

/** Zod-compatible regex the admin form enforces before write. */
export const HEX_REGEX = /^#[0-9a-f]{6}$/i;

/** Cheap runtime guard (Zod's regex is the authoritative validator). */
export function isValidHex(input: string): boolean {
  return HEX_REGEX.test(input);
}

export type ThemeMap = Record<ThemeKey, string | null>;

/**
 * Resolve all 8 theme colors from the Setting table.
 *
 * - `cachedGetSetting` wraps each lookup in `unstable_cache` keyed on the
 *   individual `settings:<key>` tag with a 10-minute TTL.
 * - The outer `unstable_cache` bundles them so a single admin write can
 *   invalidate all 8 with one `revalidateTag(THEME_TAG)`.
 * - Falls back to `DEFAULT_THEME_HEX` (from tokens.css) when the DB row
 *   is missing — this lets the system boot cleanly on a fresh DB before
 *   the admin opens the theme page.
 */
export const getTheme = cache(
  (): Promise<ThemeMap> =>
    unstable_cache(
      async () => {
        const [primary, secondary, surfaceCanvas, surfaceWarm, surfaceDark, inkHeading, hairline, badge] =
          await Promise.all([
            cachedGetSetting('theme.primary'),
            cachedGetSetting('theme.secondary'),
            cachedGetSetting('theme.surface.canvas'),
            cachedGetSetting('theme.surface.warm'),
            cachedGetSetting('theme.surface.dark'),
            cachedGetSetting('theme.ink.heading'),
            cachedGetSetting('theme.hairline'),
            cachedGetSetting('theme.badge')
          ]);
        return {
          'theme.primary': primary ?? DEFAULT_THEME_HEX['theme.primary'],
          'theme.secondary': secondary ?? DEFAULT_THEME_HEX['theme.secondary'],
          'theme.surface.canvas': surfaceCanvas ?? DEFAULT_THEME_HEX['theme.surface.canvas'],
          'theme.surface.warm': surfaceWarm ?? DEFAULT_THEME_HEX['theme.surface.warm'],
          'theme.surface.dark': surfaceDark ?? DEFAULT_THEME_HEX['theme.surface.dark'],
          'theme.ink.heading': inkHeading ?? DEFAULT_THEME_HEX['theme.ink.heading'],
          'theme.hairline': hairline ?? DEFAULT_THEME_HEX['theme.hairline'],
          'theme.badge': badge ?? DEFAULT_THEME_HEX['theme.badge']
        };
      },
      ['theme'],
      { tags: [THEME_TAG], revalidate: 600 }
    )()
);
