// app/(site)/tim-kiem/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo';
import { searchPosts } from '@/modules/search/server';
import { parsePage } from '@/lib/pagination';
import { Pagination } from '@/components/site/Pagination';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Tìm kiếm — 9ent',
  description: 'Tìm bài viết trên blog 9ent.',
  path: '/tim-kiem',
  noindex: true
});

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const page = parsePage(sp.page);
  const result = q
    ? await searchPosts({ q, page, pageSize: 12 }).catch(() => ({ rows: [], total: 0 }))
    : { rows: [], total: 0 };

  const pageCount = Math.max(1, Math.ceil(result.total / 12));

  return (
    <Container width="prose" className="py-16">
      <h1 className="mb-8 text-4xl">Tìm kiếm</h1>
      <form action="/tim-kiem" method="get" className="mb-10 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nhập từ khóa…"
          className="flex-1 border border-line bg-bg px-3 py-2 text-sm"
        />
        <button type="submit" className="border border-line bg-fg px-4 py-2 text-sm text-bg">
          Tìm
        </button>
      </form>

      {q && (
        <p className="mb-6 text-sm text-muted">
          {result.total} kết quả cho <strong>“{q}”</strong>
        </p>
      )}

      {result.rows.length > 0 ? (
        <ul className="space-y-4">
          {result.rows.map((hit) => (
            <li key={hit.post.id} className="border-b border-line pb-4">
              <Link href={`/blog/${hit.post.slug}`} className="text-xl hover:text-accent">
                {hit.post.title}
              </Link>
              {hit.snippet && <p className="mt-2 text-sm text-muted">{hit.snippet}</p>}
            </li>
          ))}
        </ul>
      ) : q ? (
        <p className="text-muted">Không tìm thấy kết quả.</p>
      ) : null}

      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(p) => `/tim-kiem?q=${encodeURIComponent(q)}&page=${p}`}
      />
    </Container>
  );
}
