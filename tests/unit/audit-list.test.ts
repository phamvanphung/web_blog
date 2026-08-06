import { describe, it, expect, vi } from 'vitest';

const { findMany, count, deleteMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([{ id: 'a1', action: 'post.create' }]),
  count: vi.fn().mockResolvedValue(7),
  deleteMany: vi.fn().mockResolvedValue({ count: 3 })
}));

vi.mock('@/lib/db', () => ({
  db: {
    auditLog: { findMany, count, deleteMany }
  }
}));

import { listAuditEntries, deleteOldAuditEntries } from '@/modules/audit/server/list';

describe('listAuditEntries', () => {
  it('returns rows + total from db.auditLog', async () => {
    const out = await listAuditEntries({}, { page: 1, pageSize: 20 });
    expect(out.rows.length).toBe(1);
    expect(out.total).toBe(7);
    expect(findMany).toHaveBeenCalled();
    expect(count).toHaveBeenCalled();
  });

  it('applies action filter', async () => {
    findMany.mockClear();
    count.mockClear();
    await listAuditEntries({ action: 'post.create' }, { page: 1, pageSize: 20 });
    const arg = findMany.mock.calls[0]?.[0];
    expect(arg).toEqual(
      expect.objectContaining({ where: expect.objectContaining({ action: 'post.create' }) })
    );
  });

  it('combines from + to date filter', async () => {
    findMany.mockClear();
    const from = new Date('2025-01-01');
    const to = new Date('2025-02-01');
    await listAuditEntries({ from, to }, { page: 2, pageSize: 50 });
    const arg = findMany.mock.calls[0]?.[0];
    expect(arg?.where?.createdAt?.gte).toBe(from);
    expect(arg?.where?.createdAt?.lte).toBe(to);
    expect(arg.skip).toBe(50);
    expect(arg.take).toBe(50);
  });
});

describe('deleteOldAuditEntries', () => {
  it('calls db.auditLog.deleteMany with cutoff', async () => {
    deleteMany.mockClear();
    const n = await deleteOldAuditEntries(90);
    expect(n).toBe(3);
    const arg = deleteMany.mock.calls[0]?.[0];
    expect(arg?.where?.createdAt?.lt).toBeInstanceOf(Date);
  });
});
