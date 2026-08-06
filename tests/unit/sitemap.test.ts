import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    post: {
      findMany: vi.fn().mockResolvedValue([{ slug: 'a', updatedAt: new Date('2025-02-02') }])
    },
    page: {
      findMany: vi.fn().mockResolvedValue([{ slug: 'gioi-thieu', updatedAt: new Date('2025-01-01') }])
    },
    category: {
      findMany: vi.fn().mockResolvedValue([{ slug: 'du-an', updatedAt: new Date('2025-01-15') }])
    }
  }
}));

vi.stubEnv('APP_URL', 'https://example.test');

import { default as sitemap } from '@/app/(site)/sitemap';

const APP_URL = 'https://example.test';

describe('sitemap', () => {
  it('includes home, posts, pages, categories', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${APP_URL}/`);
    expect(urls).toContain(`${APP_URL}/blog`);
    expect(urls).toContain(`${APP_URL}/blog/a`);
    expect(urls).toContain(`${APP_URL}/gioi-thieu`);
    expect(urls).toContain(`${APP_URL}/chu-de/du-an`);
  });
});
