// modules/auth/server/session.ts
// Server-only session helpers. Read/write the `sid` cookie, validate against
// the Session table.

import { randomBytes, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'sid';
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? '14');

export const SESSION_COOKIE = COOKIE_NAME;

/** Generate a cryptographically random 32-byte session id (64 hex chars). */
export function newSessionId(): string {
  return randomBytes(32).toString('hex');
}

/** SHA-256(pepper + ip), truncated to fit @db.VarChar(64). */
export function hashIpSync(ip: string): string {
  const pepper = process.env.SESSION_IP_PEPPER ?? '';
  return createHash('sha256')
    .update(pepper + '|' + ip)
    .digest('hex')
    .slice(0, 64);
}

/**
 * Create a new session row + set the cookie. Returns the session id.
 * Caller (login action) is responsible for setting lastLoginAt on the user.
 */
export async function createSession(args: {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: {
      id,
      userId: args.userId,
      expiresAt,
      userAgent: args.userAgent ? args.userAgent.slice(0, 500) : null,
      ipHash: args.ip ? hashIpSync(args.ip) : null
    }
  });
  const jar = await cookies();
  jar.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  });
  return id;
}

/**
 * Look up the active session from the request cookie. Returns null if no
 * cookie, no row, or row is expired. Updates `lastLoginAt` lazily? No — kept
 * for the explicit login flow to avoid touching the DB on every request.
 */
export async function readSession(): Promise<{ sid: string; user: SessionUser } | null> {
  const jar = await cookies();
  const sid = jar.get(COOKIE_NAME)?.value;
  if (!sid) return null;
  const row = await db.session.findUnique({
    where: { id: sid },
    include: { user: true }
  });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    // expired — clean up
    await db.session.delete({ where: { id: sid } }).catch(() => {});
    return null;
  }
  if (row.user.status !== 'ACTIVE') return null;
  return {
    sid,
    user: {
      id: row.user.id,
      email: row.user.email,
      name: row.user.name,
      role: row.user.role
    }
  };
}

/** Destroy a session row + clear the cookie. */
export async function destroySession(sid: string): Promise<void> {
  await db.session.delete({ where: { id: sid } }).catch(() => {});
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
