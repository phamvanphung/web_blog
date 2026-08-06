import { describe, it, expect } from 'vitest';
import { siblingPathsFor } from '@/modules/media/server/paths';

describe('siblingPathsFor', () => {
  it('returns 4 sibling paths sharing the same upload UUID', () => {
    const out = siblingPathsFor('2026/08/abc-123-original.webp');
    expect(out).toEqual([
      '2026/08/abc-123-original.webp',
      '2026/08/abc-123-large.webp',
      '2026/08/abc-123-medium.webp',
      '2026/08/abc-123-thumb.webp'
    ]);
  });

  it('handles UUIDs containing hyphens (only splits at the last one)', () => {
    const out = siblingPathsFor('2026/08/abc-def-ghi-original.webp');
    expect(out).toEqual([
      '2026/08/abc-def-ghi-original.webp',
      '2026/08/abc-def-ghi-large.webp',
      '2026/08/abc-def-ghi-medium.webp',
      '2026/08/abc-def-ghi-thumb.webp'
    ]);
  });

  it('always returns 4 paths — rm({force:true}) swallows missing files for legacy rows', () => {
    expect(siblingPathsFor('no-variant-suffix.webp')).toEqual([
      'no-variant-original.webp',
      'no-variant-large.webp',
      'no-variant-medium.webp',
      'no-variant-thumb.webp'
    ]);
  });

  it('handles root-level paths with no directory', () => {
    const out = siblingPathsFor('abc-original.webp');
    expect(out).toEqual([
      'abc-original.webp',
      'abc-large.webp',
      'abc-medium.webp',
      'abc-thumb.webp'
    ]);
  });
});
