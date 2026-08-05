// lib/auth.ts
// Stub for auth utilities. Full implementation arrives in P1 (Auth & Settings).
// Public API here MUST match what P1 will export so callers can import today
// without churn later.

import type { UserRole } from '@prisma/client';

/** Minimal user shape that admin modules will pass around. P1 may extend. */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

/**
 * Resolve the current session from a request context.
 * STUB: returns null until P1 ships.
 */
export async function getSession(): Promise<SessionUser | null> {
  return null;
}

/**
 * Require an authenticated session; throw otherwise. For use in Server Components
 * and Server Actions that must reject anonymous callers.
 * STUB: throws until P1 ships.
 */
export async function requireAuth(): Promise<SessionUser> {
  throw new Error('Not implemented (P1)');
}

/**
 * Require a session whose user has the given role.
 * STUB: throws until P1 ships.
 */
export async function requireRole(_role: UserRole): Promise<SessionUser> {
  throw new Error('Not implemented (P1)');
}

/**
 * Hash a plaintext password with argon2id.
 * STUB: throws until P1 ships.
 */
export async function hashPassword(_plain: string): Promise<string> {
  throw new Error('hashPassword not implemented yet (P1)');
}

/**
 * Verify a plaintext password against a stored argon2id hash.
 * STUB: throws until P1 ships.
 */
export async function verifyPassword(_plain: string, _hash: string): Promise<boolean> {
  throw new Error('verifyPassword not implemented yet (P1)');
}
