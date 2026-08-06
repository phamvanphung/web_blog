import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import { getCategoryBySlug, listCategoriesWithCounts } from '@/modules/categories/server/public';

vi.mock('@/lib/db', () => ({
  db: {
    category: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

describe('public categories', () => {
  it('getCategoryBySlug returns row', async () => {
    const row = { id: 'c1', slug: 'du-an', name: 'Dự án' };
    (db.category.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    expect(await getCategoryBySlug('du-an')).toEqual(row);
  });

  it('listCategoriesWithCounts filters by PUBLISHED + not-deleted', async () => {
    (db.category.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'c1', slug: 'a', name: 'A', description: null, _count: { posts: 5 } }
    ]);
    const rows = await listCategoriesWithCounts();
    expect(rows[0].count).toBe(5);
    const call = (db.category.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.include._count.select.posts.where).toMatchObject({
      post: { status: 'PUBLISHED', deletedAt: null }
    });
  });
});
