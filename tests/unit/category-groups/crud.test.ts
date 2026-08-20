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

const g = db.categoryGroup as unknown as Record<string, ReturnType<typeof vi.fn>>;
const c = db.category as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe('listGroups', () => {
  it('returns groups sorted by sortOrder asc', async () => {
    g.findMany.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
    const result = await listGroups();
    expect(result).toHaveLength(2);
    expect(g.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: 'asc' } });
  });
});

describe('getGroup', () => {
  it('finds by id first', async () => {
    g.findUnique.mockResolvedValueOnce({ id: 'a', slug: 'x' });
    const r = await getGroup('a');
    expect(r?.id).toBe('a');
  });
  it('falls back to slug lookup', async () => {
    g.findUnique.mockResolvedValueOnce(null);
    g.findUnique.mockResolvedValueOnce({ id: 'b', slug: 'y' });
    const r = await getGroup('y');
    expect(r?.id).toBe('b');
  });
});

describe('createGroup', () => {
  it('slugifies the name and inserts', async () => {
    g.findUnique.mockResolvedValueOnce(null); // ensureUniqueSlug: first try OK
    g.create.mockResolvedValueOnce({ id: 'g1', slug: 'company', name: 'Company' });
    const r = await createGroup({ name: 'Company' });
    expect(r.slug).toBe('company');
    expect(g.create).toHaveBeenCalledWith({
      data: { name: 'Company', slug: 'company' }
    });
  });

  it('appends -2 on slug collision', async () => {
    g.findUnique.mockResolvedValueOnce({ id: 'x' }); // "company" taken
    g.findUnique.mockResolvedValueOnce(null);        // "company-2" free
    g.create.mockResolvedValueOnce({ id: 'g2', slug: 'company-2', name: 'Company' });
    const r = await createGroup({ name: 'Company' });
    expect(r.slug).toBe('company-2');
  });
});

describe('updateGroup', () => {
  it('updates only provided fields', async () => {
    g.update.mockResolvedValueOnce({ id: 'g1', name: 'New', sortOrder: 5 });
    await updateGroup('g1', { sortOrder: 5 });
    expect(g.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { sortOrder: 5 }
    });
  });
});

describe('deleteGroup', () => {
  it('refuses to delete the protected default group', async () => {
    g.findUnique.mockResolvedValueOnce({ id: 'grp_default', isProtected: true });
    await expect(deleteGroup('grp_default')).rejects.toThrow(/protected/);
  });

  it('refuses to delete a group with referencing categories', async () => {
    g.findUnique.mockResolvedValueOnce({ id: 'g1', isProtected: false });
    c.count.mockResolvedValueOnce(3);
    await expect(deleteGroup('g1')).rejects.toThrow(/3 category/);
  });

  it('deletes a non-protected group with zero references', async () => {
    g.findUnique.mockResolvedValueOnce({ id: 'g2', isProtected: false });
    c.count.mockResolvedValueOnce(0);
    g.delete.mockResolvedValueOnce(undefined);
    await deleteGroup('g2');
    expect(g.delete).toHaveBeenCalledWith({ where: { id: 'g2' } });
  });
});

describe('countGroupCategories', () => {
  it('returns the count of categories for a group', async () => {
    c.count.mockResolvedValueOnce(7);
    expect(await countGroupCategories('g1')).toBe(7);
  });
});
