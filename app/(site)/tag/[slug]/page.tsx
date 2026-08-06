// app/(site)/tag/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { PostCard } from '@/components/site/PostCard';
import { Pagination } from '@/components/site/Pagination';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { getTagBySlug } from '@/modules/tags/server/public';
import { listPublishedPosts } from '@/modules/posts/server/public';
import { parsePage } from '@/lib/pagination';
import { breadcrumbJsonLd, collectionPageJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 120;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTagBySlug(slug);
  if (!t) return { title: 'Không tìm thấy' };
  return buildMetadata({
    title: `#${t.name} — 9ent`,
    description: `Bài viết gắn thẻ ${t.name}.`,
    path: `/tag/${t.slug}`
  });
}

export default async function TagPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const page = parsePage(sp.page);
  const result = await listPublishedPosts({ tagId: tag.id, page, pageSize: 12 }).catch(() => ({
    rows: [],
    total: 0,
    page: 1,
    pageSize: 12,
    pageCount: 1
  }));

  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
  const url = `${APP_URL}/tag/${slug}`;

  return (
    <Container width="prose" className="py-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${APP_URL}/` },
          { name: 'Chủ đề', url: `${APP_URL}/chu-de` },
          { name: `#${tag.name}`, url }
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: `#${tag.name}`,
          description: null,
          url
        })}
      />
      <p className="mb-2 text-sm uppercase tracking-widest text-muted">Tag</p>
      <h1 className="mb-8 text-4xl">#{tag.name}</h1>
      {result.rows.length === 0 ? (
        <p className="text-muted">Chưa có bài viết gắn thẻ này.</p>
      ) : (
        result.rows.map((p) => <PostCard key={p.id} post={p} />)
      )}
      <Pagination
        page={page}
        pageCount={result.pageCount}
        hrefFor={(p) => (p === 1 ? `/tag/${slug}` : `/tag/${slug}?page=${p}`)}
      />
    </Container>
  );
}
