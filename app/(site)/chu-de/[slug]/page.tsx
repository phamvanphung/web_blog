// app/(site)/chu-de/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { PostCard } from '@/components/site/PostCard';
import { Pagination } from '@/components/site/Pagination';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { getCategoryBySlug } from '@/modules/categories/server/public';
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

  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
  const url = `${APP_URL}/chu-de/${slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${APP_URL}/` },
          { name: 'Chủ đề', url: `${APP_URL}/chu-de` },
          { name: category.name, url }
        ])}
      />
      <JsonLd
        data={collectionPageJsonLd({
          name: category.name,
          description: category.description ?? null,
          url
        })}
      />

      <Tile tone="parchment">
        <Container width="wide" className="py-20 text-center">
          <p className="mb-3 text-[13px] uppercase tracking-[0.08em] text-ink-48">
            Chủ đề
          </p>
          <h1 className="text-d-md">{category.name}</h1>
          {category.description && (
            <p className="mx-auto mt-3 max-w-[44ch] text-[17px] text-ink-80">
              {category.description}
            </p>
          )}
        </Container>
      </Tile>

      <Tile tone="light">
        <Container width="wide" className="py-section">
          {result.rows.length === 0 ? (
            <p className="text-ink-48">Chưa có bài viết trong chủ đề này.</p>
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
            hrefFor={(p) => (p === 1 ? `/chu-de/${slug}` : `/chu-de/${slug}?page=${p}`)}
          />
        </Container>
      </Tile>
    </>
  );
}
