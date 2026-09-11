import { describe, it, expect } from 'vitest';
import { buildZaloUrl, buildMessengerUrl } from '@/lib/chat-urls';

describe('buildZaloUrl', () => {
  it('returns null for empty / null / whitespace input', () => {
    expect(buildZaloUrl(null)).toBeNull();
    expect(buildZaloUrl('')).toBeNull();
    expect(buildZaloUrl('   ')).toBeNull();
  });

  it('strips non-digits but preserves order', () => {
    expect(buildZaloUrl('+84 912 345 678')).toBe('https://zalo.me/84912345678');
    expect(buildZaloUrl('0912-345-678')).toBe('https://zalo.me/0912345678');
    expect(buildZaloUrl('(0912) 345 678')).toBe('https://zalo.me/0912345678');
  });

  it('returns null when fewer than 8 digits', () => {
    expect(buildZaloUrl('12345')).toBeNull();
    expect(buildZaloUrl('+1-2-3')).toBeNull();
  });

  it('accepts 8+ digits', () => {
    expect(buildZaloUrl('0912345678')).toBe('https://zalo.me/0912345678');
  });
});

describe('buildMessengerUrl', () => {
  it('returns null for empty / null / whitespace', () => {
    expect(buildMessengerUrl(null)).toBeNull();
    expect(buildMessengerUrl('')).toBeNull();
    expect(buildMessengerUrl('   ')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(buildMessengerUrl('abc')).toBeNull();
    expect(buildMessengerUrl('123abc')).toBeNull();
    expect(buildMessengerUrl('12.34')).toBeNull();
  });

  it('rejects too-short or too-long IDs', () => {
    expect(buildMessengerUrl('12345')).toBeNull(); // < 6 digits
    expect(buildMessengerUrl('1'.repeat(31))).toBeNull(); // > 30 digits
  });

  it('accepts valid Page IDs (6-30 digits)', () => {
    expect(buildMessengerUrl('123456789012345')).toBe('https://m.me/123456789012345');
    expect(buildMessengerUrl('  123456  ')).toBe('https://m.me/123456'); // trims
  });
});
