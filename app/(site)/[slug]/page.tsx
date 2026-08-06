// app/(site)/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { buildMetadata } from '@/lib/seo';
import { getPublishedPageBySlug } from '@/modules/pages/server/public';
import { findRedirectForPath } from '@/lib/redirects';

export const revalidate = 300;

// Slugs reserved for OTHER routes — fall through to 404.
const RESERVED = new Set([
  'blog',
  'chu-de',
  'tag',
  'tim-kiem',
  'lien-he',
  'rss',
  'uploads',
  'admin',
  'api',
  'sitemap',
  'robots'
]);

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug)) return { title: 'Không tìm thấy' };
  const page = await getPublishedPageBySlug(slug);
  if (!page) return { title: 'Không tìm thấy' };
  return buildMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.title,
    path: `/${page.slug}`
  });
}

export default async function StaticPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();
  const path = `/${slug}`;
  const r = await findRedirectForPath(path);
  if (r) redirect(r.toPath);
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  // Plain-text content — render as paragraphs separated by blank lines.
  const paragraphs = page.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Tile tone="light">
      <Container width="prose" className="py-section">
        <h1 className="text-d-md">{page.title}</h1>
        <div className="prose mt-md">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Container>
    </Tile>
  );
}
