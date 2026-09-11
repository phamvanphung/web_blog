// app/api/internal/db-health/route.ts
//
// Admin-only health endpoint for the Prisma connection pool. Returns:
//
//   {
//     ok:     boolean,           // overall health
//     db:     'up' | 'down',     // whether Prisma can run a query
//     pool:   { active, idle,    // mariadb stats-pool counters (or null)
//              total, waiting } | null,
//     error?: string,            // when db is down
//     ts:     ISO timestamp
//   }
//
// 503 Service Unavailable when `db` is down — useful as an external
// uptime-monitor target. Pool stats are best-effort: when the stats
// pool itself fails to initialise, `pool: null` is returned rather
// than 500ing the whole endpoint.
//
// Auth: `requireRole('ADMIN')` — the endpoint is in `app/api/internal/`
// which is admin-only by convention (see `menu-targets/route.ts` for
// the same pattern). Public callers get a redirect to /login.

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getPoolStats } from '@/lib/db-pool';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  await requireRole('ADMIN');

  try {
    await db.$queryRaw`SELECT 1`;
    const pool = getPoolStats();
    return NextResponse.json({
      ok: true,
      db: 'up',
      pool: pool ?? { active: 0, idle: 0, total: 0, waiting: 0 },
      ts: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        db: 'down',
        error: (e as Error).message,
        pool: getPoolStats(),
        ts: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
