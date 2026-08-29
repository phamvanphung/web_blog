// lib/db.ts
// Prisma client singleton. HMR-resilient: cache is invalidated when the
// client config (log levels, adapter, etc.) changes — bumps `CONFIG_KEY`.

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __prismaConfigKey: string | undefined;
};

// Bump this whenever client construction options change. On HMR reload,
// the cached instance is reused only when its key matches — otherwise the
// stale client is dropped and a fresh one is created with the new config.
// (Without this, edits to `log: [...]` or adapter options never take effect
// because the singleton caches the first-ever instance in globalThis.)
const CONFIG_KEY = 'log:error:v2';

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({
    adapter,
    // Only fatal client errors. Disable `query` / `warn` — they leak raw
    // SQL (parameter values, table names, IDs) to stdout which any
    // process with terminal access (or browser console in dev) can read.
    log: ['error']
  });
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.__prismaConfigKey === CONFIG_KEY) {
    return cached;
  }
  const fresh = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = fresh;
    globalForPrisma.__prismaConfigKey = CONFIG_KEY;
  }
  return fresh;
}

export const prisma = getPrisma();

// `db` is the conventional alias used by route handlers and Server Components
// (see app/admin/(authenticated)/dashboard/page.tsx). Re-exporting it keeps
// imports readable while preserving the original `prisma` name for clarity.
export const db = prisma;

export default prisma;
