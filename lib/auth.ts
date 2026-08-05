// lib/auth.ts
// Stub for auth utilities. Full implementation arrives in Task 1.x (P1 phase).
// Keep this file present so other modules can import the eventual API surface
// without churn when the real implementation lands.

export type AuthSession = {
  userId: string;
  sessionId: string;
  role: 'ADMIN' | 'EDITOR';
};

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; reason: 'unauthenticated' | 'expired' | 'invalid' };

/**
 * Resolve the current session from a request. Real impl will read the
 * session cookie, look up the Session row, and validate expiry.
 * STUB: returns unauthenticated until P1 ships.
 */
export async function getSessionFromRequest(_req: Request): Promise<AuthResult> {
  return { ok: false, reason: 'unauthenticated' };
}

/**
 * Hash a plaintext password with argon2id. STUB: throws until P1 ships.
 */
export async function hashPassword(_plain: string): Promise<string> {
  throw new Error('hashPassword not implemented yet (P1)');
}

/**
 * Verify a plaintext password against a stored hash. STUB: throws until P1 ships.
 */
export async function verifyPassword(_plain: string, _hash: string): Promise<boolean> {
  throw new Error('verifyPassword not implemented yet (P1)');
}

export const auth = {
  getSessionFromRequest,
  hashPassword,
  verifyPassword
};

export default auth;
