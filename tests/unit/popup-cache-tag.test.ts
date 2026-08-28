// tests/unit/popup-cache-tag.test.ts
// Verify CRUD revalidates both admin-list and public tags.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { revalidateTag } = vi.hoisted(() => {
  return { revalidateTag: vi.fn() };
});

const audit = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const hashIp = vi.hoisted(() => vi.fn().mockResolvedValue('h'));
const requireRole = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'u1', role: 'ADMIN' }));
const headers = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    get: (k: string) => (k === 'x-forwarded-for' ? '1.2.3.4' : null)
  })
);

const findUnique = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'p1', name: 'x' }));
const update = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'p1' }));

vi.mock('next/cache', () => ({
  revalidateTag,
  unstable_cache: <T extends (...a: unknown[]) => unknown>(fn: T) => fn
}));
vi.mock('next/headers', () => ({ headers }));
vi.mock('@/lib/auth', () => ({ requireRole }));
vi.mock('@/lib/audit', () => ({ audit, hashIp }));
vi.mock('@/lib/db', () => ({
  db: {
    popup: { create, update, findUnique, findMany: vi.fn() }
  }
}));

import { createPopup, updatePopup, softDeletePopup } from '@/modules/popups/server';

beforeEach(() => {
  vi.clearAllMocks();
  audit.mockClear();
  findUnique.mockResolvedValue({ id: 'p1' });
});

describe('CRUD revalidates tags', () => {
  it('createPopup revalidates admin + public tags', async () => {
    await createPopup({
      name: 'Promo',
      htmlContent: '<p>x</p>',
      triggerType: 'ALL',
      triggerPaths: null,
      frequency: 'ONCE',
      delaySeconds: 0,
      status: 'DRAFT',
      notes: null
    });
    const tags = revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain('popups:admin-list');
    expect(tags).toContain('popups:public');
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'popup.create', target: 'Popup', targetId: 'p1' })
    );
  });

  it('updatePopup revalidates admin + public tags', async () => {
    await updatePopup({ id: 'p1', name: 'Updated' });
    const tags = revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain('popups:admin-list');
    expect(tags).toContain('popups:public');
  });

  it('softDeletePopup sets deletedAt and revalidates tags', async () => {
    await softDeletePopup('p1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) })
      })
    );
    const tags = revalidateTag.mock.calls.map((c) => c[0]);
    expect(tags).toContain('popups:admin-list');
    expect(tags).toContain('popups:public');
  });
});
