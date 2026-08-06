import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { listPublishedPosts, getPublishedPostBySlug } from '@/modules/posts/server/public';

vi.mock('@/lib/db', () => ({
  db: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn()
    }
  }
}));

describe('public posts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listPublishedPosts excludes DRAFT/TRASHED and deletedAt', async () => {
    (db.post.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.post.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await listPublishedPosts({ page: 1, pageSize: 12 });
    const call = (db.post.findMany as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(call?.where.status).toBe('PUBLISHED');
    expect(call?.where.deletedAt).toBeNull();
    expect(call?.skip).toBe(0);
    expect(call?.take).toBe(12);
  });

  it('getPublishedPostBySlug returns null for DRAFT', async () => {
    (db.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      slug: 'x',
      status: 'DRAFT',
      deletedAt: null
    });
    expect(await getPublishedPostBySlug('x')).toBeNull();
  });

  it('getPublishedPostBySlug returns row for PUBLISHED', async () => {
    const row = { slug: 'x', status: 'PUBLISHED', deletedAt: null };
    (db.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    expect(await getPublishedPostBySlug('x')).toEqual(row);
  });

  it('getPublishedPostBySlug returns null for null row', async () => {
    (db.post.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await getPublishedPostBySlug('x')).toBeNull();
  });
});
