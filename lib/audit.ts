// lib/audit.ts
// Append entries to the AuditLog table. Best-effort: never throw to callers
// (we don't want a failed audit write to break a successful login).

import { db } from '@/lib/db';

export type AuditInput = {
  userId?: string | null;
  action: string;
  target?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        target: input.target ?? null,
        targetId: input.targetId ?? null,
        metadata: (input.metadata as object | undefined) ?? undefined,
        ipHash: input.ipHash ?? null
      }
    });
  } catch (e) {
    // Best-effort: never throw to caller. We swallow the DB write error
    // here intentionally — losing an audit row is preferable to failing
    // the user-facing action (login, save, etc.). If you need to
    // observe these failures, query the AuditLog table for gaps.
    void e;
  }
}

/**
 * Hash an IP address with the server pepper. Returns null when input is empty.
 */
export async function hashIp(ip: string | null | undefined): Promise<string | null> {
  if (!ip) return null;
  const pepper = process.env.SESSION_IP_PEPPER ?? '';
  const { createHash } = await import('node:crypto');
  return createHash('sha256')
    .update(pepper + '|' + ip)
    .digest('hex');
}
