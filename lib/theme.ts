// lib/theme.ts
// Single source of truth for the public-site brand colors read from the
// `Setting` table. Mirrors the two-layer caching pattern in `lib/brand.ts`:
//   • outer `react.cache`  → per-request dedup
//   • inner `unstable_cache` → cross-request persistence, tag `settings:theme`
//
// Admin theme writes call `revalidateTag('settings:theme')` to invalidate.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { cachedGetSettings } from '@/modules/settings/server';
import { THEME_KEYS, type ThemeKey } from '@/modules/settings/types';

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
 * - `cachedGetSettings('theme', THEME_KEYS)` batches the lookup into ONE
 *   `findMany({ where: { key: { in: THEME_KEYS } } })` → ONE pool acquire.
 *   Previously each key went through its own `cachedGetSetting`, so a
 *   cache miss after `revalidateTag(THEME_TAG)` fired 8 concurrent
 *   `findUnique` calls and could exhaust the pool under load.
 * - Tagged with `THEME_TAG` AND every per-key tag, so admin writes that
 *   invalidate via either path still bust the cache.
 * - Falls back to `DEFAULT_THEME_HEX` (from tokens.css) when the DB row
 *   is missing — this lets the system boot cleanly on a fresh DB before
 *   the admin opens the theme page.
 */
export const getTheme = cache(
  (): Promise<ResolvedTheme> =>
    unstable_cache(
      async () => {
        const rows = await cachedGetSettings('theme', THEME_KEYS);
        return {
          'theme.primary': rows['theme.primary'] ?? DEFAULT_THEME_HEX['theme.primary'],
          'theme.secondary': rows['theme.secondary'] ?? DEFAULT_THEME_HEX['theme.secondary'],
          'theme.surface.canvas':
            rows['theme.surface.canvas'] ?? DEFAULT_THEME_HEX['theme.surface.canvas'],
          'theme.surface.warm':
            rows['theme.surface.warm'] ?? DEFAULT_THEME_HEX['theme.surface.warm'],
          'theme.surface.dark':
            rows['theme.surface.dark'] ?? DEFAULT_THEME_HEX['theme.surface.dark'],
          'theme.ink.heading':
            rows['theme.ink.heading'] ?? DEFAULT_THEME_HEX['theme.ink.heading'],
          'theme.hairline': rows['theme.hairline'] ?? DEFAULT_THEME_HEX['theme.hairline'],
          'theme.badge': rows['theme.badge'] ?? DEFAULT_THEME_HEX['theme.badge']
        };
      },
      ['theme'],
      { tags: [THEME_TAG], revalidate: 600 }
    )()
);
