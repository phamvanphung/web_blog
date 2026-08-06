import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import { getPublishedPageBySlug } from '@/modules/pages/server/public';

vi.mock('@/lib/db', () => ({ db: { page: { findUnique: vi.fn() } } }));

describe('public pages', () => {
  it('returns null for DRAFT', async () => {
    (db.page.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      slug: 'a',
      status: 'DRAFT'
    });
    expect(await getPublishedPageBySlug('a')).toBeNull();
  });
  it('returns row for PUBLISHED', async () => {
    const row = { slug: 'a', status: 'PUBLISHED' };
    (db.page.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    expect(await getPublishedPageBySlug('a')).toEqual(row);
  });
  it('returns null for HIDDEN', async () => {
    (db.page.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      slug: 'a',
      status: 'HIDDEN'
    });
    expect(await getPublishedPageBySlug('a')).toBeNull();
  });
  it('returns null for null row', async () => {
    (db.page.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getPublishedPageBySlug('a')).toBeNull();
  });
});
