// app/(site)/blog/page.tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { PostCard } from '@/components/site/PostCard';
import { Pagination } from '@/components/site/Pagination';
import { buildMetadata } from '@/lib/seo';
import { listPublishedPosts } from '@/modules/posts/server/public';
import { parsePage } from '@/lib/pagination';

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: 'Blog — 9ent',
  description: 'Tất cả bài viết của 9ent.',
  path: '/blog'
});

export default async function BlogListPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const result = await listPublishedPosts({ page, pageSize: 12 }).catch(() => ({
    rows: [],
    total: 0,
    page: 1,
    pageSize: 12,
    pageCount: 1
  }));

  return (
    <>
      <Tile tone="parchment">
        <Container width="wide" className="py-20 text-center">
          {/* h1 must remain literally "Blog" — tests/e2e/public-blog.spec asserts
              the FIRST h1 on /blog matches /Blog/i */}
          <h1 className="text-d-md">Blog</h1>
          <p className="mx-auto mt-3 max-w-[44ch] text-[17px] text-ink-80">
            Tất cả bài viết của 9ent — được publish khi chúng tôi thật sự có gì
            muốn chia sẻ.
          </p>
        </Container>
      </Tile>
      <Tile tone="light">
        <Container width="wide" className="py-section">
          {result.rows.length === 0 ? (
            <p className="text-ink-48">Chưa có bài viết nào.</p>
          ) : (
            <div className="divide-y divide-hairline border-y border-hairline">
              {result.rows.map((p) => (
                <PostCard key={p.id} post={p} variant="row" />
              ))}
            </div>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefFor={(p) => (p === 1 ? '/blog' : `/blog?page=${p}`)}
          />
        </Container>
      </Tile>
    </>
  );
}
