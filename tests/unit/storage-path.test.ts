import { describe, it, expect } from 'vitest';
import { pathForUpload, newStoredName } from '@/lib/storage';

describe('pathForUpload', () => {
  it('returns YYYY/MM/<name> shape', () => {
    const out = pathForUpload('abc.webp');
    expect(out).toMatch(/^\d{4}\/\d{2}\/abc\.webp$/);
  });
});

describe('newStoredName', () => {
  it('returns a UUID-like with .webp by default', () => {
    const a = newStoredName();
    expect(a).toMatch(/^[0-9a-f-]+\.webp$/);
  });
  it('honours a custom ext', () => {
    expect(newStoredName('jpg')).toMatch(/\.jpg$/);
  });
});
