import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPoolStats } from '@/lib/db-pool';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: 'up',
      // Pool stats are best-effort — the stats pool is separate from
      // Prisma's pool (see lib/db-pool.ts) and may be temporarily
      // unavailable even when Prisma is healthy. Callers should treat
      // `pool: null` as "no data" not "broken".
      pool: getPoolStats(),
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
