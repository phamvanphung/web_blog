// lib/auth.ts
// Real authentication helpers. Argon2id for passwords; DB-backed sessions.
// Server-only — do NOT import from a Client Component.

import { hash, verify } from '@node-rs/argon2';
import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { readSession } from '@/modules/auth/server/session';

/** Argon2id parameters — chosen OWASP-recommended for interactive auth (2024).
 *  algorithm: 2 = Algorithm.Argon2id (const enum, used as numeric to satisfy isolatedModules). */
const ARGON_OPTS = {
  algorithm: 2,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON_OPTS);
}

export async function verifyPassword(plain: string, digest: string): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    // verify throws on malformed digest; treat as "no match".
    return false;
  }
}

export type { UserRole };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function getSession(): Promise<SessionUser | null> {
  const s = await readSession();
  return s?.user ?? null;
}

export async function requireAuth(): Promise<SessionUser> {
  const s = await readSession();
  if (!s) {
    redirect('/admin/login');
  }
  return s.user;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== role) {
    // not authorized — bounce to dashboard with a code (404 would be fine too)
    redirect('/admin/dashboard?denied=1');
  }
  return user;
}
