import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  countGroupCategories
} from '@/modules/category-groups/server';

vi.mock('@/lib/db', () => ({
  db: {
    categoryGroup: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    category: { count: vi.fn() }
  }
}));

describe('listGroups', () => {
  it('returns groups sorted by sortOrder asc', async () => {
    (db.categoryGroup.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
    const result = await listGroups();
    expect(result).toHaveLength(2);
    expect(db.categoryGroup.findMany as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({ orderBy: { sortOrder: 'asc' } });
  });
});

describe('getGroup', () => {
  it('finds by id first', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'a', slug: 'x' });
    const r = await getGroup('a');
    expect(r?.id).toBe('a');
  });
  it('falls back to slug lookup', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'b', slug: 'y' });
    const r = await getGroup('y');
    expect(r?.id).toBe('b');
  });
});

describe('createGroup', () => {
  it('slugifies the name and inserts', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (db.categoryGroup.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'g1', slug: 'company', name: 'Company' });
    const r = await createGroup({ name: 'Company' });
    expect(r.slug).toBe('company');
    expect(db.categoryGroup.create as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      data: { name: 'Company', slug: 'company' }
    });
  });

  it('appends -2 on slug collision', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'x' });
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (db.categoryGroup.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'g2', slug: 'company-2', name: 'Company' });
    const r = await createGroup({ name: 'Company' });
    expect(r.slug).toBe('company-2');
  });
});

describe('updateGroup', () => {
  it('updates only provided fields', async () => {
    (db.categoryGroup.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'g1', name: 'New', sortOrder: 5 });
    await updateGroup('g1', { sortOrder: 5 });
    expect(db.categoryGroup.update as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { sortOrder: 5 }
    });
  });
});

describe('deleteGroup', () => {
  it('refuses to delete the protected default group', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'grp_default', isProtected: true });
    await expect(deleteGroup('grp_default')).rejects.toThrow(/protected/);
  });

  it('refuses to delete a group with referencing categories', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'g1', isProtected: false });
    (db.category.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(3);
    await expect(deleteGroup('g1')).rejects.toThrow(/3 category/);
  });

  it('deletes a non-protected group with zero references', async () => {
    (db.categoryGroup.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'g2', isProtected: false });
    (db.category.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(0);
    (db.categoryGroup.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    await deleteGroup('g2');
    expect(db.categoryGroup.delete as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({ where: { id: 'g2' } });
  });
});

describe('countGroupCategories', () => {
  it('returns the count of categories for a group', async () => {
    (db.category.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(7);
    expect(await countGroupCategories('g1')).toBe(7);
  });
});
