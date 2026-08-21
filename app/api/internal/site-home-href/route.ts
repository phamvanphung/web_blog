// app/api/internal/site-home-href/route.ts
// Node-runtime endpoint read by the root-path middleware
// (`/middleware.ts`). Edge middleware cannot instantiate the
// MariaDB adapter, so it fetches this URL instead and lets Node
// resolve `site.homeHref` through the regular server cache path.
//
// Response shape:
//   { href: string | null }
//
// `href` is the raw configured value (already trimmed) or `null`
// when the setting is missing/empty. The middleware decides whether
// to redirect — we just hand back what's in the DB.
//
// Cache semantics:
//   `force-dynamic` so every middleware fetch sees the latest
//   setting without an intermediate HTTP cache. Cross-request
//   deduplication still happens inside `getHomeHref()` via
//   `unstable_cache` + `revalidateTag('settings:brand')`.

import { NextResponse } from 'next/server';
import { getHomeHref } from '@/lib/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const href = await getHomeHref();
    // Normalise to `null` when the setting collapses to the default
    // (`/`) so the middleware can bail with a single null check.
    const trimmed = href?.trim();
    const value = trimmed && trimmed !== '/' ? trimmed : null;
    return NextResponse.json({ href: value }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    return NextResponse.json(
      { href: null, error: (e as Error).message },
      { status: 200, headers: { 'cache-control': 'no-store' } }
    );
  }
}