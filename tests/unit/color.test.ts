import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, deriveFocus, applyThemeOverrides, type ThemeMap } from '@/lib/color';

describe('hexToHsl / hslToHex', () => {
  it('converts pure red #ff0000 to hsl(0, 100%, 50%)', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts pure green #00ff00 to hsl(120, 100%, 50%)', () => {
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts pure blue #0000ff to hsl(240, 100%, 50%)', () => {
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('round-trips hex → hsl → hex for non-grayscale colors', () => {
    const original = '#8e211c';
    const hsl = hexToHsl(original);
    const back = hslToHex(hsl);
    expect(back.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('handles 3-digit shorthand #abc → #aabbcc', () => {
    const hsl = hexToHsl('#abc');
    expect(hslToHex(hsl)).toBe('#aabbcc');
  });
});

describe('deriveFocus', () => {
  it('darkens #8e211c (red) by ~12% lightness', () => {
    const base = '#8e211c';
    const focus = deriveFocus(base);
    expect(focus).toMatch(/^#[0-9a-f]{6}$/);
    const baseHsl = hexToHsl(base);
    const focusHsl = hexToHsl(focus);
    expect(focusHsl.l).toBeLessThan(baseHsl.l);
    expect(focusHsl.l).toBeGreaterThanOrEqual(Math.max(0, baseHsl.l - 15));
  });

  it('clamps lightness to 0 for very dark colors', () => {
    const focus = deriveFocus('#000000');
    expect(focus).toBe('#000000');
  });

  it('clamps lightness to a minimum of 5% (never pure black unless input was black)', () => {
    const focus = deriveFocus('#ffffff');
    const focusHsl = hexToHsl(focus);
    expect(focusHsl.l).toBeGreaterThanOrEqual(5);
  });
});

describe('applyThemeOverrides', () => {
  it('returns empty string when map is empty', () => {
    expect(applyThemeOverrides({})).toBe('');
  });

  it('emits :root{--color-primary:#abc123;...} for non-null values', () => {
    const theme: ThemeMap = {
      'theme.primary': '#1e40af',
      'theme.secondary': null
    };
    expect(applyThemeOverrides(theme)).toBe(
      ':root{--color-primary:#1e40af;--color-primary-focus:#152c7a}'
    );
  });

  it('skips null values entirely', () => {
    const theme: ThemeMap = {
      'theme.primary': '#1e40af',
      'theme.secondary': null,
      'theme.hairline': '#f0d9d9'
    };
    const out = applyThemeOverrides(theme);
    expect(out).not.toContain('secondary');
    expect(out).toContain('--color-primary:#1e40af');
    expect(out).toContain('--color-hairline:#f0d9d9');
  });

  it('includes auto-derived focus/hover tokens for primary/secondary', () => {
    const theme: ThemeMap = { 'theme.primary': '#1e40af' };
    const out = applyThemeOverrides(theme);
    expect(out).toContain('--color-primary:#1e40af');
    expect(out).toContain('--color-primary-focus:');
    expect(out).not.toContain('--color-secondary');
  });

  it('only emits derived focus when source color is present', () => {
    const theme: ThemeMap = { 'theme.secondary': '#cf6768' };
    const out = applyThemeOverrides(theme);
    expect(out).toContain('--color-secondary:#cf6768');
    expect(out).toContain('--color-secondary-hover:');
    expect(out).not.toContain('--color-primary-focus');
  });
});
