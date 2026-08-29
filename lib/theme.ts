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

// DEFAULT_THEME_HEX / HEX_REGEX / isValidHex live in the client-safe
// `modules/settings/theme-defaults.ts` so the admin form can import them
// without pulling in `unstable_cache` and the Prisma-backed setting cache.
// Imported here so `getTheme()` can fall back to defaults, and re-exported
// for existing server-side callers (`page.tsx`, `actions.ts` dynamic
// import, unit tests).
import {
  DEFAULT_THEME_HEX,
  HEX_REGEX,
  isValidHex
} from '@/modules/settings/theme-defaults';
export { DEFAULT_THEME_HEX, HEX_REGEX, isValidHex };

export const THEME_TAG = 'settings:theme';

export type ResolvedTheme = Record<ThemeKey, string | null>;

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
  (): Promise<ResolvedTheme> =>
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
