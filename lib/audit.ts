// lib/audit.ts
// Append entries to the AuditLog table. Best-effort: never throw to callers
// (we don't want a failed audit write to break a successful login).

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

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
    logger.warn('audit.write_failed', {
      action: input.action,
      error: (e as Error).message.slice(0, 200)
    });
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
