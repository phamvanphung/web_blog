// app/api/internal/menu-targets/route.ts
//
// Server-backed search endpoint for `<PickTargetDialog>`. The admin menu
// editor used to render all pages/posts/categories inline as a single
// <select>; that scales badly past a few hundred rows. This endpoint
// serves paginated, query-string-filtered results so the dialog can
// stay snappy regardless of how many entries exist.
//
// Auth: `requireRole('ADMIN')` — the menu editor is admin-only, and the
// data here (especially unpublished-but-listed pages) is otherwise
// privilege-scoped. The page-level matcher `app/api/internal/` is not
// itself a security boundary (the route is reachable from any caller
// with admin session) — but role check inside the handler is.
//
// Query params:
//   ?type=PAGE|POST|CATEGORY   (required)
//   ?q=<substring>             (optional; matches title/name + slug)
//   ?page=<1-based>            (default 1)
//   ?pageSize=<1..50>          (default 20)
//
// Response: { items: [{ id, label }], page, pageSize, total }
//
// Cache: `force-dynamic` — admins expect edits in the dialog to show up
// immediately, and the dataset is bounded enough that cache value is
// negligible.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  type: z.enum(['PAGE', 'POST', 'CATEGORY']),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

type SearchItem = { id: string; label: string };

export async function GET(req: NextRequest) {
  await requireRole('ADMIN');

  const sp = req.nextUrl.searchParams;
  const parsed = QuerySchema.safeParse({
    type: sp.get('type'),
    q: sp.get('q') ?? undefined,
    page: sp.get('page') ?? undefined,
    pageSize: sp.get('pageSize') ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { type, q, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  // Empty-q searches match all rows. We still build a `contains` filter,
  // just with an always-true clause — keeps the branch shape uniform.
  const search = q && q.length > 0 ? q : undefined;

  let items: SearchItem[] = [];
  let total = 0;

  if (type === 'PAGE') {
    const where = search
      ? {
          status: 'PUBLISHED' as const,
          OR: [
            { title: { contains: search } },
            { slug: { contains: search } }
          ]
        }
      : { status: 'PUBLISHED' as const };

    const [rows, count] = await Promise.all([
      db.page.findMany({
        where,
        select: { id: true, title: true, slug: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: pageSize
      }),
      db.page.count({ where })
    ]);
    items = rows.map((p) => ({ id: p.id, label: `${p.title} — /${p.slug}` }));
    total = count;
  } else if (type === 'POST') {
    const where = search
      ? {
          status: 'PUBLISHED' as const,
          deletedAt: null,
          OR: [
            { title: { contains: search } },
            { slug: { contains: search } }
          ]
        }
      : { status: 'PUBLISHED' as const, deletedAt: null };

    const [rows, count] = await Promise.all([
      db.post.findMany({
        where,
        select: { id: true, title: true, slug: true, publishedAt: true },
        orderBy: [{ publishedAt: 'desc' }],
        skip,
        take: pageSize
      }),
      db.post.count({ where })
    ]);
    items = rows.map((p) => ({ id: p.id, label: `${p.title} — /${p.slug}` }));
    total = count;
  } else {
    const where = search
      ? {
          hidden: false,
          OR: [
            { name: { contains: search } },
            { slug: { contains: search } }
          ]
        }
      : { hidden: false };

    const [rows, count] = await Promise.all([
      db.category.findMany({
        where,
        select: { id: true, name: true, slug: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: pageSize
      }),
      db.category.count({ where })
    ]);
    items = rows.map((c) => ({ id: c.id, label: `${c.name} — /${c.slug}` }));
    total = count;
  }

  return NextResponse.json(
    { items, page, pageSize, total },
    { headers: { 'cache-control': 'no-store' } }
  );
}
