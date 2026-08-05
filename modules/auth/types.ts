import type { UserRole } from '@prisma/client';

export type Credentials = { email: string; password: string };
export type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: number; // unix ms
};
