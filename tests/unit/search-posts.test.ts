import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import { searchPosts } from '@/modules/search/server';

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: vi.fn(),
    post: { findMany: vi.fn(), count: vi.fn() }
  }
}));

describe('searchPosts', () => {
  it('uses $queryRaw for q.length >= 4', async () => {
    (db.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]).mockResolvedValueOnce([{ c: 0 }]);
    await searchPosts({ q: 'hello world' });
    expect(db.$queryRaw).toHaveBeenCalled();
  });

  it('uses LIKE for q.length < 4', async () => {
    (db.post.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.post.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await searchPosts({ q: 'ab' });
    expect(db.post.findMany).toHaveBeenCalled();
    const where = (db.post.findMany as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].where;
    expect(where?.OR).toBeDefined();
  });

  it('returns empty for empty q', async () => {
    const out = await searchPosts({ q: '' });
    expect(out.rows).toEqual([]);
  });
});
