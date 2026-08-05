import { describe, it, expect } from 'vitest';
import { slugify, ensureUniqueSlug } from '@/lib/slug';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });
  it('strips Vietnamese diacritics', () => {
    expect(slugify('Giới thiệu')).toBe('gioi-thieu');
    expect(slugify('Dự án 2024')).toBe('du-an-2024');
  });
  it('collapses repeated hyphens and trims', () => {
    expect(slugify('  foo -- bar  ')).toBe('foo-bar');
  });
  it('returns empty for all-separator input', () => {
    expect(slugify('---')).toBe('');
  });
  it('preserves alphanumerics', () => {
    expect(slugify('Post 123 v2!')).toBe('post-123-v2');
  });
});

describe('ensureUniqueSlug', () => {
  it('returns base if unused', async () => {
    const exists = async (_s: string) => false;
    expect(await ensureUniqueSlug('foo', exists)).toBe('foo');
  });
  it('appends -2 if base used', async () => {
    const exists = async (s: string) => s === 'foo';
    expect(await ensureUniqueSlug('foo', exists)).toBe('foo-2');
  });
  it('keeps incrementing', async () => {
    const taken = new Set(['foo', 'foo-2', 'foo-3']);
    const exists = async (s: string) => taken.has(s);
    expect(await ensureUniqueSlug('foo', exists)).toBe('foo-4');
  });
});
