import { describe, it, expect } from 'vitest';
import { postSlugFromTitle, ensureUniquePostSlug } from '@/modules/posts/server';

describe('postSlugFromTitle', () => {
  it('slugifies a normal title', () => {
    expect(postSlugFromTitle('Hello World')).toBe('hello-world');
  });
  it('strips diacritics', () => {
    expect(postSlugFromTitle('Giới thiệu 9ent')).toBe('gioi-thieu-9ent');
  });
  it('falls back to "post" for empty', () => {
    expect(postSlugFromTitle('   ---   ')).toBe('post');
  });
});

describe('ensureUniquePostSlug', () => {
  it('returns base when unused', async () => {
    const exists = async (_s: string) => false;
    expect(await ensureUniquePostSlug('hello', exists)).toBe('hello');
  });

  it('appends -2 when base used', async () => {
    const exists = async (s: string) => s === 'hello';
    expect(await ensureUniquePostSlug('hello', exists)).toBe('hello-2');
  });
});
