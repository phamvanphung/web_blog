import { describe, it, expect } from 'vitest';
import { pageSlugFromTitle, ensureUniquePageSlug } from '@/modules/pages/server';

describe('pageSlugFromTitle', () => {
  it('slugifies a normal title', () => {
    expect(pageSlugFromTitle('About Us')).toBe('about-us');
  });
  it('strips Vietnamese diacritics', () => {
    expect(pageSlugFromTitle('Giới thiệu')).toBe('gioi-thieu');
  });
  it('falls back to "page" for empty', () => {
    expect(pageSlugFromTitle('   ---   ')).toBe('page');
  });
});

describe('ensureUniquePageSlug', () => {
  it('returns base when unused', async () => {
    const exists = async (_s: string) => false;
    expect(await ensureUniquePageSlug('about', exists)).toBe('about');
  });
  it('appends -2 when base used', async () => {
    const exists = async (s: string) => s === 'about';
    expect(await ensureUniquePageSlug('about', exists)).toBe('about-2');
  });
});
