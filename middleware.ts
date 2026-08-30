// middleware.ts
// Edge-runtime middleware. Runs BEFORE every request hits a route
// handler. We use it to redirect the bare root URL `/` to whatever
// the admin has configured under `site.homeHref`. When the setting
// is unset or `/`, the middleware is a no-op and the homepage server
// component renders as usual.
//
// Why middleware (vs redirect() in `app/(site)/page.tsx`):
//   • The homepage's data-fetching (Prisma queries, Menu lookups,
//     featured posts) only runs when the request is *intended* to
//     land on `/`. A redirect at the edge skips all of that.
//   • Setting changes propagate via the in-process cache below
//     (TTL: 60 s). Admin writes invalidate the underlying Node-side
//     `unstable_cache` immediately via `revalidateTag`; the edge
//     cache is bounded by TTL since cross-worker invalidation is
//     not possible from `revalidateTag`.
//
// Why NOT use Prisma directly here:
//   The MariaDB driver (`@prisma/adapter-mariadb`) uses Node-only
//   APIs (net/dns/Buffer) and cannot run in the Edge runtime.
//   Trying it throws inside the Edge sandbox, the failure path
//   returns `null`, and the redirect silently never fires. Instead,
//   the middleware fetches `/api/internal/site-home-href`, which
//   runs in Node and reuses the regular server-side setting cache.
//
// What middleware does NOT touch:
//   • Any path other than `/` — `/blog`, `/chu-de`, `/admin/*`,
//     `/_next/*`, `/api/*`, `/favicon.ico` etc. all pass through.
//   • Same-origin absolute URLs (admin might configure
//     `https://example.com/landing`): we redirect to that URL
//     unchanged. The browser handles cross-origin hops normally.

import { NextRequest, NextResponse } from 'next/server';

/** Path-name we care about. */
const ROOT_PATH = '/';

/**
 * Tiny process-scoped cache. The Edge runtime may run multiple
 * instances per region but every instance maintains its own copy
 * of this object. After an admin write, the next request on each
 * instance re-fetches the endpoint and the stale entry is replaced
 * within `STALE_AFTER_MS`. This bounds the worst-case staleness
 * without requiring a cross-instance cache.
 *
 * 1 s chosen for UX — admin saves `site.homeHref`, refreshes `/`,
 * and the redirect reflects the new target almost immediately.
 * Workload cost is negligible: the Node endpoint behind this is
 * already memoised via `unstable_cache` (BRAND_TAG, 600 s revalidate
 * + invalidation on every admin write), so a cache miss here is
 * usually an in-process memo hit that costs one HTTP round-trip
 * (intra-Next, no real network).
 */
const STALE_AFTER_MS = 1_000;

type CacheEntry = { value: string | null; loadedAt: number };
declare global {
  // eslint-disable-next-line no-var
  var __homeHrefCache: CacheEntry | undefined;
}

const fetchHomeHrefFromApi = async (origin: string): Promise<string | null> => {
  // No-cache so we never serve a stale 200 after an admin write.
  // The Node-side endpoint already memoises via `unstable_cache`.
  const res = await fetch(`${origin}/api/internal/site-home-href`, {
    cache: 'no-store',
    headers: { accept: 'application/json' }
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { href?: unknown };
  const href = typeof data.href === 'string' ? data.href.trim() : '';
  return href && href.length > 0 ? href : null;
};

const getCachedHomeHref = async (origin: string): Promise<string | null> => {
  const now = Date.now();
  const cached = globalThis.__homeHrefCache;
  if (cached && now - cached.loadedAt < STALE_AFTER_MS) {
    return cached.value;
  }
  try {
    const value = await fetchHomeHrefFromApi(origin);
    globalThis.__homeHrefCache = { value, loadedAt: now };
    return value;
  } catch {
    // Endpoint unreachable / parse failure — fail open, let the
    // homepage render normally. Cache the failure so we don't keep
    // trying for every request during an outage.
    globalThis.__homeHrefCache = { value: null, loadedAt: now };
    return null;
  }
};

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Always set x-pathname so the (site) layout can read the current path.
  // The redirect branch below also forwards the header on the rewritten
  // request so downstream server components see the original pathname.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const forwarded = NextResponse.next({ request: { headers: requestHeaders } });

  // Only the bare root runs the homeHref redirect. Everything else is a
  // no-op pass-through that has already been stamped with x-pathname.
  if (pathname !== ROOT_PATH) return forwarded;

  const homeHref = await getCachedHomeHref(request.nextUrl.origin);

  // No setting (or the default `/`) → no redirect. The homepage renders.
  if (!homeHref || homeHref === '/') return forwarded;

  const target =
    /^https?:\/\//i.test(homeHref)
      ? new URL(homeHref)
      : new URL(homeHref + search, request.nextUrl.origin);

  return NextResponse.redirect(target, 307);
}

// Match every non-static path so we can stamp x-pathname. The homeHref
// redirect inside the function still only fires for `/`. Static assets
// (`_next/*`, `/favicon.ico`, etc.) are excluded so the middleware does
// zero work for them.
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)']
};