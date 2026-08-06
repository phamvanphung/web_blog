// app/(site)/tim-kiem/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
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
    <>
      <Tile tone="parchment">
        <Container width="wide" className="py-20 text-center">
          <p className="mb-3 text-[13px] uppercase tracking-[0.08em] text-ink-48">
            Tìm bài viết
          </p>
          <h1 className="text-d-md">Tìm kiếm</h1>
        </Container>
      </Tile>
      <Tile tone="light">
        <Container width="prose" className="py-section">
          {/* IMPORTANT: this page MUST contain exactly one `input[name="q"]` and
              one `button[type="submit"]` (Playwright strict mode in
              tests/e2e/public-search.spec.ts). Do not duplicate them inside
              Header / Footer / SubNav. */}
          <form action="/tim-kiem" method="get" className="mb-10 flex items-center gap-3">
            <SearchInput name="q" defaultValue={q} placeholder="Nhập từ khóa…" />
            <Button type="submit" variant="primary-pill">
              Tìm
            </Button>
          </form>

          {q && (
            <p className="mb-6 text-[13px] text-ink-48">
              {result.total} kết quả cho <strong className="text-ink">“{q}”</strong>
            </p>
          )}

          {result.rows.length > 0 ? (
            <ul className="divide-y divide-hairline border-y border-hairline">
              {result.rows.map((hit) => (
                <li key={hit.post.id} className="py-6">
                  <Link
                    href={`/blog/${hit.post.slug}`}
                    className="text-[21px] font-semibold tracking-tight text-ink hover:text-primary"
                  >
                    {hit.post.title}
                  </Link>
                  {hit.snippet && (
                    <p className="mt-2 text-[15px] leading-snug text-ink-80">
                      {hit.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : q ? (
            <p className="text-ink-48">Không tìm thấy kết quả.</p>
          ) : null}

          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={(p) => `/tim-kiem?q=${encodeURIComponent(q)}&page=${p}`}
          />
        </Container>
      </Tile>
    </>
  );
}
