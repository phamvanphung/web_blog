// lib/color.ts
// Pure-function helpers for the Theme Management feature.
// All hex inputs MUST be in `#rrggbb` or `#rgb` form. Lowercase output.

export type Hex = `#${string}`;

export type Hsl = { h: number; s: number; l: number };

export type ThemeMap = {
  'theme.primary'?: string | null;
  'theme.secondary'?: string | null;
  'theme.surface.canvas'?: string | null;
  'theme.surface.warm'?: string | null;
  'theme.surface.dark'?: string | null;
  'theme.ink.heading'?: string | null;
  'theme.hairline'?: string | null;
  'theme.badge'?: string | null;
};

/** Map from a theme.* setting key → CSS variable name(s) it controls. */
const KEY_TO_TOKENS: Record<keyof ThemeMap, string[]> = {
  'theme.primary': ['--color-primary', '--color-primary-focus'],
  'theme.secondary': ['--color-secondary', '--color-secondary-hover'],
  'theme.surface.canvas': ['--color-canvas'],
  'theme.surface.warm': ['--color-canvas-parchment', '--color-surface-pearl'],
  'theme.surface.dark': [
    '--color-surface-tile-1',
    '--color-surface-tile-2',
    '--color-surface-tile-3',
    '--color-surface-black'
  ],
  'theme.ink.heading': ['--color-ink', '--color-ink-muted-80', '--color-ink-muted-48'],
  'theme.hairline': ['--color-hairline', '--color-divider-soft'],
  'theme.badge': ['--color-badge']
};

/** Map from a theme.* setting key → which derivative token (if any) is auto-computed. */
const DERIVED_TOKENS: Partial<Record<keyof ThemeMap, { token: string; source: keyof ThemeMap }>> = {
  'theme.primary': { token: '--color-primary-focus', source: 'theme.primary' },
  'theme.secondary': { token: '--color-secondary-hover', source: 'theme.secondary' },
  'theme.surface.warm': { token: '--color-surface-pearl', source: 'theme.surface.warm' },
  'theme.surface.dark': { token: '--color-surface-black', source: 'theme.surface.dark' },
  'theme.ink.heading': { token: '--color-ink-muted-80', source: 'theme.ink.heading' },
  'theme.hairline': { token: '--color-divider-soft', source: 'theme.hairline' }
};

/** Normalize 3-digit hex `#abc` → `#aabbcc`. Throws on invalid input. */
function normalizeHex(input: string): string {
  const s = input.trim().toLowerCase();
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`;
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(s);
  if (m6) return `#${m6[1]}${m6[2]}${m6[3]}`;
  throw new Error(`Invalid hex color: ${input}`);
}

/** Convert `#rrggbb` to HSL. h ∈ [0,360), s,l ∈ [0,100]. */
export function hexToHsl(hex: string): Hsl {
  const h = normalizeHex(hex);
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        hue = ((b - r) / d + 2) * 60;
        break;
      case b:
        hue = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Convert HSL back to `#rrggbb` lowercase. */
export function hslToHex({ h, s, l }: Hsl): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else if (hp < 6) [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  const to255 = (v: number) =>
    Math.max(0, Math.min(255, Math.round((v + m) * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${to255(r)}${to255(g)}${to255(b)}`;
}

/**
 * Derive a focus/hover variant from a base color by reducing HSL lightness
 * by 12 percentage points. Clamps to ≥ 5% lightness to avoid pure-black
 * inputs producing identical output. Pure-black (#000000) stays pure-black.
 */
export function deriveFocus(baseHex: string): string {
  const normalized = normalizeHex(baseHex);
  if (normalized === '#000000') return '#000000';
  const hsl = hexToHsl(normalized);
  const darkened: Hsl = {
    h: hsl.h,
    s: hsl.s,
    l: Math.max(5, Math.min(95, hsl.l - 12))
  };
  return hslToHex(darkened);
}

/**
 * Build an inline `<style>:root{...}</style>` payload from a partial theme map.
 * Skips null/undefined entries. Auto-computes the focus/hover derived tokens
 * for keys whose source color is present.
 */
export function applyThemeOverrides(map: ThemeMap): string {
  const lines: string[] = [];
  for (const key of Object.keys(KEY_TO_TOKENS) as (keyof ThemeMap)[]) {
    const value = map[key];
    if (value == null) continue;
    const baseHex = normalizeHex(value);
    for (const token of KEY_TO_TOKENS[key]) {
      const derived = DERIVED_TOKENS[key];
      if (derived && derived.token === token) continue;
      lines.push(`${token}:${baseHex}`);
    }
    const derived = DERIVED_TOKENS[key];
    if (derived && map[derived.source]) {
      lines.push(`${derived.token}:${deriveFocus(baseHex)}`);
    }
  }
  if (lines.length === 0) return '';
  return `:root{${lines.join(';')}}`;
}
