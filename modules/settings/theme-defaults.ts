// modules/settings/theme-defaults.ts
// Client-safe constants for the theme management feature. No server-only
// imports (no Prisma, no `next/cache`, no `cache` from React in server-only
// usage). Both client components (ThemeForm) and server code (lib/theme.ts,
// prisma/seed.ts) can import from here so the values never drift.
//
// Source of truth for the hex defaults shipped in `styles/tokens.css`. The
// admin "Khôi phục mặc định" button writes these to the Setting table, and
// the seed script pre-populates them so a fresh DB boots with the same colors
// the static CSS expects.

import type { ThemeKey } from './types';

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