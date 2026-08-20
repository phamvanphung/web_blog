// app/(site)/[slug]/page.tsx
import type { Metadata } from 'next';
import type { Section } from '@/modules/pages/types';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { buildMetadata } from '@/lib/seo';
import { getPublishedPageBySlug } from '@/modules/pages/server/public';
import { findRedirectForPath } from '@/lib/redirects';
import { BlockRenderer } from '@/components/site/BlockRenderer';
import { JsonLd } from '@/components/site/JsonLd';
import { webPageJsonLd } from '@/modules/seo/lib/jsonld';

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

  const sections = (page.sections ?? []) as Section[];
  // A page with a single rawhtml section is a self-contained landing page —
  // skip our chrome (Tile/Container/title) so the pasted markup owns the layout.
  const isFullLanding = sections.length === 1 && sections[0]?.kind === 'rawhtml';

  return (
    <>
      <JsonLd data={webPageJsonLd({ title: page.title, description: page.seoDescription, slug: page.slug })} />
      {isFullLanding ? (
        <BlockRenderer sections={sections} />
      ) : (
        <Tile tone="light">
          <Container width="prose" className="py-section">
            <BlockRenderer sections={sections} />
          </Container>
        </Tile>
      )}
    </>
  );
}
