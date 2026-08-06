// app/(site)/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PostCard } from '@/components/site/PostCard';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { getBrand } from '@/lib/brand';
import { listFeaturedPosts, listPublishedPosts } from '@/modules/posts/server/public';
import { websiteJsonLd, organizationJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 60;

// Async metadata — reads the same React-cached brand helper as the page below.
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return buildMetadata({
    title: `${brand.siteName} — ${brand.tagline}`,
    description: brand.taglineLong,
    path: '/'
  });
}

export default async function HomePage() {
  const brand = await getBrand();
  const [featured, recent] = await Promise.all([
    listFeaturedPosts(3).catch(() => []),
    listPublishedPosts({ page: 1, pageSize: 6 }).catch(() => ({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 6,
      pageCount: 1
    }))
  ]);

  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

  return (
    <>
      <JsonLd data={websiteJsonLd({ name: brand.siteName, url: APP_URL })} />
      <JsonLd
        data={organizationJsonLd({
          name: brand.siteName,
          url: APP_URL,
          logo: `${APP_URL}/logo.svg`
        })}
      />

      {/* Hero — parchment full-bleed band */}
      <Tile tone="parchment">
        <Container width="wide" className="py-section text-center">
          <p className="mb-4 text-[13px] uppercase tracking-[0.08em] text-ink-48">
            {brand.siteName.toLowerCase()}.vn
          </p>
          {/* h1 text MUST remain a match for /Blog công ty 9ent/i — asserted
              by tests/e2e/home.spec.ts. We read it from `site.tagline` which
              defaults to exactly that string. */}
          <h1 className="mx-auto max-w-[16ch] text-d-lg text-ink">{brand.tagline}</h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[21px] leading-[1.38] text-ink-80">
            {brand.taglineLong}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/blog" variant="primary-pill">
              Đọc blog
            </ButtonLink>
            <ButtonLink href="/lien-he" variant="secondary-pill">
              Liên hệ
            </ButtonLink>
          </div>
        </Container>
      </Tile>

      {/* Featured — dark tile band */}
      {featured.length > 0 && (
        <Tile tone="dark">
          <Container width="wide" className="py-section">
            <h2 className="mb-8 text-d-sm text-ink-ondark">Bài nổi bật</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featured.map((p) => (
                <PostCard key={p.id} post={p} variant="card" tone="ondark" />
              ))}
            </div>
          </Container>
        </Tile>
      )}

      {/* Latest — canvas band, hairline rows */}
      <Tile tone="light">
        <Container width="wide" className="py-section">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="text-d-sm">Mới nhất</h2>
            <Link href="/blog" className="text-[15px] text-primary hover:underline">
              Xem tất cả ›
            </Link>
          </div>
          {recent.rows.length === 0 ? (
            <p className="text-ink-48">Chưa có bài viết nào.</p>
          ) : (
            <div className="divide-y divide-hairline border-y border-hairline">
              {recent.rows.map((p) => (
                <PostCard key={p.id} post={p} variant="row" />
              ))}
            </div>
          )}
        </Container>
      </Tile>
    </>
  );
}
