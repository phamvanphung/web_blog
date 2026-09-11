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
//
// v3: append pool tuning (connectionLimit / acquireTimeout / connectTimeout
// / idleTimeout / keepAliveDelay) as URL query parameters so the mariadb
// driver parses them at connect time. See `buildDatabaseUrl` for details.
const CONFIG_KEY = 'log:error:v3';

/**
 * Read a positive integer from `process.env`, falling back to a default
 * when unset / empty. Throws on malformed values so misconfiguration is
 * loud rather than silently zeroing the pool.
 */
function intEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be a positive integer; got ${JSON.stringify(raw)}`);
  }
  return n;
}

/**
 * Build the actual connection string passed to `PrismaMariaDb`. We keep
 * `DATABASE_URL` as the single source of truth for connection-string
 * format (user / host / db / etc.) and APPEND pool tuning as query
 * parameters — mariadb's URL parser (`mariadb://...?connectionLimit=...`)
 * applies them as connection options at connect time. This avoids
 * re-parsing the URL into individual fields and stays compatible with
 * any existing query params the operator may have on `DATABASE_URL`.
 *
 * Defaults are tuned for a cross-internet MariaDB deployment (DB on a
 * remote VPS, not localhost):
 *   - connectionLimit=20: headroom for 13+ concurrent cachedGetSetting
 *     fanout on cache miss + admin dashboard. Capped by server's
 *     `max_connections` (default 151).
 *   - acquireTimeout=30s: absorb transient spikes without 500ing users.
 *   - connectTimeout=5s: cross-internet TCP+TLS handshake to a remote
 *     VPS needs more than the driver default of 1s.
 *   - idleTimeout=600s (10min): MUST be lower than MySQL `@@wait_timeout`
 *     (default 28800s = 8h) so the pool closes idle connections before
 *     the server kills them. Comfortably below common `wait_timeout` and
 *     aggressive firewall idle timers (5–15 min).
 *   - keepAliveDelay=30s: send TCP keep-alive probes to defeat
 *     NAT/firewall idle-killers. mariadb default is 0 (off).
 *
 * NOTE: mariadb's `idleTimeout` is in SECONDS, not milliseconds. We expose
 * it as `DB_POOL_IDLE_TIMEOUT_MS` for consistency with other DB_*_MS vars
 * and divide internally.
 */
function buildDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');

  const url = new URL(raw);
  url.searchParams.set('connectionLimit', String(intEnv('DB_POOL_LIMIT', 20)));
  url.searchParams.set(
    'acquireTimeout',
    String(intEnv('DB_POOL_ACQUIRE_TIMEOUT_MS', 30_000))
  );
  url.searchParams.set(
    'connectTimeout',
    String(intEnv('DB_POOL_CONNECT_TIMEOUT_MS', 5_000))
  );
  url.searchParams.set(
    'idleTimeout',
    String(Math.floor(intEnv('DB_POOL_IDLE_TIMEOUT_MS', 600_000) / 1000))
  );
  url.searchParams.set(
    'keepAliveDelay',
    String(intEnv('DB_POOL_KEEPALIVE_DELAY_MS', 30_000))
  );
  return url.toString();
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb(buildDatabaseUrl());
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
