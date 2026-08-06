import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import { findRedirectForPath } from '@/lib/redirects';

vi.mock('@/lib/db', () => ({ db: { redirect: { findUnique: vi.fn() } } }));

describe('findRedirectForPath', () => {
  it('returns null on no match', async () => {
    (db.redirect.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    expect(await findRedirectForPath('/blog/old')).toBeNull();
  });
  it('returns row on match', async () => {
    const row = { fromPath: '/blog/old', toPath: '/blog/new', statusCode: 301 };
    (db.redirect.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    expect(await findRedirectForPath('/blog/old')).toEqual(row);
  });
});
