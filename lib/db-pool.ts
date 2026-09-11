// lib/db-pool.ts
// Introspection-only mariadb pool for `/api/internal/db-health` and
// `/api/health`. NOT used for application queries — `lib/db.ts`'s
// Prisma client owns the real pool.
//
// Why a separate pool: `PrismaClient` in v7 does not expose the
// underlying mariadb `Pool` (no `$metrics` / `$underlyingDriver` accessor
// in the public API). Reaching into adapter internals is fragile across
// versions. A dedicated 2-connection pool gives us a reliable health
// signal: stats correlate with the real pool because both are on the
// same DB / same workload. Alert threshold: `waiting > 0` for > 60 s
// means the DB or network can't keep up.
//
// Cost: 2 idle connections to the DB. Negligible against the MariaDB
// default `max_connections=151`.

import * as mariadb from 'mariadb';

export type PoolStats = {
  /** Connections currently checked out by an active query. */
  active: number;
  /** Connections sitting idle in the pool. */
  idle: number;
  /** Total connections the pool has opened (active + idle). */
  total: number;
  /** Number of acquire requests waiting for a free connection. */
  waiting: number;
};

let statsPool: mariadb.Pool | null = null;

function getStatsPool(): mariadb.Pool {
  if (statsPool) return statsPool;
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');
  // mariadb's TS type for `createPool` is `createPool(config: PoolConfig |
  // string): Pool` — single argument. We append tuning as URL query
  // params so the URL form works without a cast. Same trick `lib/db.ts`
  // uses for the app pool, just with stats-friendly values:
  //   - connectionLimit=2 (lightweight)
  //   - acquireTimeout=5s (health probe shouldn't wait long)
  //   - idleTimeout=60s (rotate probe connection frequently so it
  //     can't be killed by the server and turn into the very
  //     `active=0 idle=0` failure mode we're trying to detect)
  //   - keepAliveDelay=30s (defeat NAT idle-killers)
  const url = new URL(raw);
  url.searchParams.set('connectionLimit', '2');
  url.searchParams.set('acquireTimeout', '5000');
  url.searchParams.set('idleTimeout', '60');
  url.searchParams.set('keepAliveDelay', '30000');
  statsPool = mariadb.createPool(url.toString());
  return statsPool;
}

/**
 * Snapshot of the stats pool's connection counters. Returns `null` if
 * the pool can't be initialised (e.g. DATABASE_URL unset) so callers
 * can keep their response shape stable and let the health endpoint
 * report `"pool": null` instead of 500ing.
 */
export function getPoolStats(): PoolStats | null {
  try {
    const pool = getStatsPool();
    return {
      active: pool.activeConnections(),
      idle: pool.idleConnections(),
      total: pool.totalConnections(),
      waiting: pool.taskQueueSize()
    };
  } catch {
    return null;
  }
}
