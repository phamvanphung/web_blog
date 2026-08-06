// modules/search/server/index.ts
// MySQL FULLTEXT search on Post.title + excerpt + contentText.
// Short queries (< 4 chars) fall back to LIKE so ngram tokenisation isn't confused.

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { SearchHit, SearchQuery } from '../types';

const PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  featuredMediaId: true
} as const;

export async function searchPosts(q: SearchQuery): Promise<{ rows: SearchHit[]; total: number }> {
  const query = (q.q ?? '').trim();
  if (!query) return { rows: [], total: 0 };

  const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 12));
  const page = Math.max(1, q.page ?? 1);
  const skip = (page - 1) * pageSize;

  if (query.length < 4) {
    const like = { contains: query };
    const where = {
      status: 'PUBLISHED' as const,
      deletedAt: null,
      OR: [{ title: like }, { excerpt: like }, { contentText: like }]
    };
    const [rows, total] = await Promise.all([
      db.post.findMany({
        where,
        select: PUBLIC_SELECT,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: pageSize
      }),
      db.post.count({ where })
    ]);
    return {
      rows: rows.map((r) => ({ post: r, snippet: snippetFromExcerpt(r.excerpt, query), score: 1 })),
      total
    };
  }

  // FULLTEXT in NATURAL LANGUAGE MODE — MySQL-friendly for Vietnamese diacritics.
  const rows = await db.$queryRaw<
    Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      publishedAt: Date | null;
      featuredMediaId: string | null;
      score: number;
    }>
  >(Prisma.sql`
      SELECT id, title, slug, excerpt, publishedAt, featuredMediaId,
             MATCH(title, excerpt, contentText) AGAINST (${query} IN NATURAL LANGUAGE MODE) AS score
      FROM Post
      WHERE status = 'PUBLISHED' AND deletedAt IS NULL
        AND MATCH(title, excerpt, contentText) AGAINST (${query} IN NATURAL LANGUAGE MODE)
      ORDER BY score DESC, publishedAt DESC
      LIMIT ${pageSize} OFFSET ${skip}
    `);
  const total = await db.$queryRaw<Array<{ c: number }>>(
    Prisma.sql`
      SELECT COUNT(*) AS c FROM Post
      WHERE status = 'PUBLISHED' AND deletedAt IS NULL
        AND MATCH(title, excerpt, contentText) AGAINST (${query} IN NATURAL LANGUAGE MODE)
    `
  ).then((r) => Number(r[0]?.c ?? 0));
  return {
    rows: rows.map((r) => ({
      post: {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        publishedAt: r.publishedAt,
        featuredMediaId: r.featuredMediaId
      },
      snippet: snippetFromExcerpt(r.excerpt, query),
      score: r.score
    })),
    total
  };
}

function snippetFromExcerpt(excerpt: string | null, query: string): string {
  const e = (excerpt ?? '').trim();
  if (!e) return '';
  if (e.toLowerCase().includes(query.toLowerCase())) {
    return e.length > 240 ? e.slice(0, 240) + '…' : e;
  }
  return e.length > 200 ? e.slice(0, 200) + '…' : e;
}
