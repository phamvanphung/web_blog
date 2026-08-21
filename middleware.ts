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
 */
const STALE_AFTER_MS = 60_000;

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

  // Only the bare root. `pathname` is always normalised so trailing
  // slashes, query strings, fragments don't reach this branch.
  if (pathname !== ROOT_PATH) return NextResponse.next();

  const homeHref = await getCachedHomeHref(request.nextUrl.origin);

  // No setting (or the default `/`) → no redirect. The homepage renders.
  if (!homeHref || homeHref === '/') return NextResponse.next();

  // Build the redirect target. Relative paths stay same-origin; we
  // copy over the original query string so a visitor arriving at
  // `/?utm=...` keeps their tracking params. Hashes can't be sent
  // server-side so they're silently dropped (browsers will scroll
  // the new page to top regardless).
  const target =
    /^https?:\/\//i.test(homeHref)
      ? new URL(homeHref)
      : new URL(homeHref + search, request.nextUrl.origin);

  // 307 preserves the HTTP method + body (here it's always GET so
  // irrelevant) and signals "this redirect is definitive, don't
  // cache it client-side". 301 is SEO-friendly but caches at
  // intermediaries — admin might point homeHref at a different
  // landing next week and we don't want stale 301s in CDNs.
  return NextResponse.redirect(target, 307);
}

// Match only `/` so the middleware cost is essentially zero for
// every other request. Next.js requires either a string array or
// a matcher object; we list the single route we care about and
// rely on `pathname !== '/'` to bail otherwise.
export const config = {
  matcher: ['/']
};