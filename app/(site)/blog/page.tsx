// app/(site)/blog/page.tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
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
    <Container width="prose" className="py-16">
      <h1 className="mb-8 text-4xl">Blog</h1>
      {result.rows.length === 0 ? (
        <p className="text-muted">Chưa có bài viết nào.</p>
      ) : (
        result.rows.map((p) => <PostCard key={p.id} post={p} />)
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(p) => (p === 1 ? '/blog' : `/blog?page=${p}`)}
      />
    </Container>
  );
}
