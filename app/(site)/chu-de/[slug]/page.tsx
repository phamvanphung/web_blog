// app/(site)/chu-de/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { PostCard } from '@/components/site/PostCard';
import { Pagination } from '@/components/site/Pagination';
import { buildMetadata } from '@/lib/seo';
import { getCategoryBySlug } from '@/modules/categories/server/public';
import { listPublishedPosts } from '@/modules/posts/server/public';
import { parsePage } from '@/lib/pagination';

export const revalidate = 120;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategoryBySlug(slug);
  if (!c) return { title: 'Không tìm thấy' };
  return buildMetadata({
    title: c.seoTitle ?? `${c.name} — 9ent`,
    description: c.seoDescription ?? c.description ?? `Bài viết thuộc chủ đề ${c.name}.`,
    path: `/chu-de/${c.slug}`
  });
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const page = parsePage(sp.page);
  const result = await listPublishedPosts({ categoryId: category.id, page, pageSize: 12 }).catch(
    () => ({ rows: [], total: 0, page: 1, pageSize: 12, pageCount: 1 })
  );

  return (
    <Container width="prose" className="py-16">
      <p className="mb-2 text-sm uppercase tracking-widest text-muted">Chủ đề</p>
      <h1 className="mb-8 text-4xl">{category.name}</h1>
      {category.description && <p className="mb-8 text-muted">{category.description}</p>}
      {result.rows.length === 0 ? (
        <p className="text-muted">Chưa có bài viết trong chủ đề này.</p>
      ) : (
        result.rows.map((p) => <PostCard key={p.id} post={p} />)
      )}
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        hrefFor={(p) => (p === 1 ? `/chu-de/${slug}` : `/chu-de/${slug}?page=${p}`)}
      />
    </Container>
  );
}
