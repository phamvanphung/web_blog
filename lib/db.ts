// lib/db.ts
// Prisma client singleton. Avoid exhausting the connection pool during HMR.

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// `db` is the conventional alias used by route handlers and Server Components
// (see app/admin/(authenticated)/dashboard/page.tsx). Re-exporting it keeps
// imports readable while preserving the original `prisma` name for clarity.
export const db = prisma;

export default prisma;
