// modules/audit/server/list.ts
// AuditLog read queries + retention purge. ADMIN-only consumer (page enforces).
import { db } from '@/lib/db';

export type AuditFilter = {
  action?: string;
  target?: string;
  userId?: string;
  from?: Date;
  to?: Date;
};

export type ListAuditResult = {
  rows: Array<{
    id: string;
    userId: string | null;
    action: string;
    target: string | null;
    targetId: string | null;
    metadata: unknown;
    ipHash: string | null;
    createdAt: Date;
  }>;
  total: number;
};

export async function listAuditEntries(
  filter: AuditFilter,
  page: { page: number; pageSize: number }
): Promise<ListAuditResult> {
  const where: Record<string, unknown> = {};
  if (filter.action) where.action = filter.action;
  if (filter.target) where.target = filter.target;
  if (filter.userId) where.userId = filter.userId;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) (where.createdAt as Record<string, Date>).gte = filter.from;
    if (filter.to) (where.createdAt as Record<string, Date>).lte = filter.to;
  }

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page.page - 1) * page.pageSize,
      take: page.pageSize
    }),
    db.auditLog.count({ where })
  ]);
  return { rows, total };
}

export async function deleteOldAuditEntries(olderThanDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 86400_000);
  const { count } = await db.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
