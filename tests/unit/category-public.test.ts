import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { getCategoryBySlug, listCategoriesWithCounts } from '@/modules/categories/server/public';

vi.mock('@/lib/db', () => ({
  db: {
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    categoryGroup: {
      findUnique: vi.fn()
    }
  }
}));

describe('public categories', () => {
  beforeEach(async () => {
    // Reset module cache BEFORE any imports happen in this test.
    await vi.resetModules();
    // Clear all mock call history and implementations.
    // mockReset() clears both implementation and call history.
    vi.mocked(db.category.findFirst).mockReset();
    vi.mocked(db.category.findMany).mockReset();
    vi.mocked(db.category.findUnique).mockReset();
    vi.mocked(db.categoryGroup.findUnique).mockReset();
    // Re-import AFTER resetting so the module uses the cleared mocks.
    // Note: this does NOT re-execute top-level code (imports are cached),
    // but it DOES re-evaluate the module factory for vi.mock('@/lib/db').
    await import('@/modules/categories/server/public');
  });

  it('getCategoryBySlug returns row', async () => {
    const row = { id: 'c1', slug: 'du-an', name: 'Dự án' };
    (db.category.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    expect(await getCategoryBySlug('du-an')).toEqual(row);
  });

  it('listCategoriesWithCounts filters by PUBLISHED + not-deleted', async () => {
    (db.category.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'c1', slug: 'a', name: 'A', description: null, _count: { posts: 5 } }
    ]);
    const rows = await listCategoriesWithCounts();
    expect(rows[0]?.count).toBe(5);
    const call = (db.category.findMany as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call?.include._count.select.posts.where).toMatchObject({
      post: { status: 'PUBLISHED', deletedAt: null }
    });
  });
});

describe('getCategoryBySlug - hidden filter', () => {
  it('returns null for hidden categories', async () => {
    const { getCategoryBySlug } = await import('@/modules/categories/server/public');
    const findFirst = db.category.findFirst as unknown as ReturnType<typeof vi.fn>;

    findFirst.mockResolvedValueOnce(null);

    const result = await getCategoryBySlug('some-slug');

    expect(result).toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'some-slug', hidden: false }
    });
  });
});

describe('listCategoriesByGroupSlug', () => {
  it('returns visible categories for the named group', async () => {
    const { listCategoriesByGroupSlug } = await import('@/modules/categories/server/public');
    const findUnique = db.categoryGroup.findUnique as unknown as ReturnType<typeof vi.fn>;
    const findMany = db.category.findMany as unknown as ReturnType<typeof vi.fn>;

    findUnique.mockResolvedValueOnce({ id: 'grp1' });
    findMany.mockResolvedValueOnce([
      { id: 'c1', name: 'Cat One', slug: 'cat-one', description: 'Desc 1' },
      { id: 'c2', name: 'Cat Two', slug: 'cat-two', description: null }
    ]);

    const result = await listCategoriesByGroupSlug('company', 12, 'sortOrder');

    expect(result).toEqual([
      { id: 'c1', name: 'Cat One', slug: 'cat-one', description: 'Desc 1' },
      { id: 'c2', name: 'Cat Two', slug: 'cat-two', description: null }
    ]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: 'company' }
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { groupId: 'grp1', hidden: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 12,
      select: { id: true, name: true, slug: true, description: true }
    });
  });

  it('returns both default group and NULL-group categories when slug is "default"', async () => {
    const { listCategoriesByGroupSlug } = await import('@/modules/categories/server/public');
    const findUnique = db.categoryGroup.findUnique as unknown as ReturnType<typeof vi.fn>;
    const findMany = db.category.findMany as unknown as ReturnType<typeof vi.fn>;

    findUnique.mockResolvedValueOnce({ id: 'grp_default' });
    findMany.mockResolvedValueOnce([]);

    await listCategoriesByGroupSlug('default', 5, 'name');

    expect(findMany).toHaveBeenCalledWith({
      where: {
        hidden: false,
        OR: [{ groupId: null }, { groupId: 'grp_default' }]
      },
      orderBy: [{ name: 'asc' }],
      take: 5,
      select: { id: true, name: true, slug: true, description: true }
    });
  });

  it('returns empty array when the group slug does not exist', async () => {
    const { listCategoriesByGroupSlug } = await import('@/modules/categories/server/public');
    const findUnique = db.categoryGroup.findUnique as unknown as ReturnType<typeof vi.fn>;
    const findMany = db.category.findMany as unknown as ReturnType<typeof vi.fn>;

    findUnique.mockResolvedValueOnce(null);
    findMany.mockResolvedValueOnce([]);

    const result = await listCategoriesByGroupSlug('nonexistent', 12, 'sortOrder');

    expect(result).toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { hidden: false, groupId: '__no_match__' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 12,
      select: { id: true, name: true, slug: true, description: true }
    });
  });

  it('maps orderBy "name" to ascending name, "sortOrder" to ascending sortOrder', async () => {
    const { listCategoriesByGroupSlug } = await import('@/modules/categories/server/public');
    const findUnique = db.categoryGroup.findUnique as unknown as ReturnType<typeof vi.fn>;
    const findMany = db.category.findMany as unknown as ReturnType<typeof vi.fn>;

    findUnique.mockResolvedValueOnce({ id: 'grp1' });
    findMany.mockResolvedValueOnce([]);

    await listCategoriesByGroupSlug('company', 20, 'name');
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ orderBy: [{ name: 'asc' }] }));

    findUnique.mockResolvedValueOnce({ id: 'grp1' });
    await listCategoriesByGroupSlug('company', 20, 'sortOrder');
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }));
  });
});
