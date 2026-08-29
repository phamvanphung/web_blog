import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME_HEX, isValidHex } from '@/lib/theme';

describe('DEFAULT_THEME_HEX', () => {
  it('contains all 8 keys with values matching styles/tokens.css defaults', () => {
    expect(DEFAULT_THEME_HEX['theme.primary']).toBe('#8e211c');
    expect(DEFAULT_THEME_HEX['theme.secondary']).toBe('#cf6768');
    expect(DEFAULT_THEME_HEX['theme.surface.canvas']).toBe('#ffffff');
    expect(DEFAULT_THEME_HEX['theme.surface.warm']).toBe('#fff7f7');
    expect(DEFAULT_THEME_HEX['theme.surface.dark']).toBe('#44100f');
    expect(DEFAULT_THEME_HEX['theme.ink.heading']).toBe('#44100f');
    expect(DEFAULT_THEME_HEX['theme.hairline']).toBe('#f0d9d9');
    expect(DEFAULT_THEME_HEX['theme.badge']).toBe('#f5d0d1');
  });
});

describe('isValidHex', () => {
  it('accepts 6-digit lowercase hex', () => {
    expect(isValidHex('#8e211c')).toBe(true);
  });

  it('accepts 6-digit uppercase hex', () => {
    expect(isValidHex('#8E211C')).toBe(true);
  });

  it('rejects 3-digit shorthand', () => {
    expect(isValidHex('#abc')).toBe(false);
  });

  it('rejects missing hash', () => {
    expect(isValidHex('8e211c')).toBe(false);
  });

  it('rejects non-hex chars', () => {
    expect(isValidHex('#zzzzzz')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidHex('')).toBe(false);
  });
});
