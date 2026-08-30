// app/(site)/page.tsx
// Editorial home — refreshed layout: hero → marquee → intro → categories grid
// → featured posts → latest posts. Header/Footer are rendered by layout.tsx;
// this file owns only the middle band.
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PostCard } from '@/components/site/PostCard';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { getBrand } from '@/lib/brand';
import { listFeaturedPosts, listPublishedPosts } from '@/modules/posts/server/public';
import { listCategoriesWithCounts } from '@/modules/categories/server/public';
import { websiteJsonLd, organizationJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 60;

// Service/topic keywords for the marquee strip. Order is intentional —
// the duplicated track loops seamlessly so the words feel like a single
// stream.
const MARQUEE_WORDS = [
  'Editorial',
  'Thương hiệu',
  'Sáng tạo nội dung',
  'YouTube',
  'Podcast',
  'TikTok',
  'Behind the scenes',
  'Photography',
  'Storytelling',
  'Workshop'
];

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
  const [featured, recent, categories] = await Promise.all([
    listFeaturedPosts(3).catch(() => []),
    listPublishedPosts({ page: 1, pageSize: 6 }).catch(() => ({
      rows: [],
      total: 0,
      page: 1,
      pageSize: 6,
      pageCount: 1
    })),
    listCategoriesWithCounts().catch(() => [])
  ]);

  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

  // JSON-LD needs an absolute logo URL — admin may set either a site-relative
  // path (`/logo.svg`) or an absolute URL. Prefix when relative.
  const logoAbsoluteUrl = (raw: string, base: string): string =>
    /^https?:\/\//i.test(raw) ? raw : `${base.replace(/\/$/, '')}${raw}`;

  // Split featured into 1 hero post + 2 side posts for visual hierarchy.
  const heroPost = featured[0];
  const sidePosts = featured.slice(1, 3);

  return (
    <>
      <JsonLd data={websiteJsonLd({ name: brand.siteName, url: APP_URL })} />
      <JsonLd
        data={organizationJsonLd({
          name: brand.siteName,
          url: APP_URL,
          logo: logoAbsoluteUrl(brand.logoUrl, APP_URL)
        })}
      />

      {/* ---- Hero ----
          Full-bleed watercolor backdrop + oversized display headline. */}
      <section className="diag-full-bleed">
        <div className="relative isolate overflow-hidden bg-canvas-parchment">
          <Image
            src="/hero-placeholder.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover"
          />
          <Container width="wide" className="relative flex min-h-[520px] flex-col justify-center py-section text-center">
            <p className="mb-4 text-[12px] uppercase tracking-[0.18em] text-ink-48">
              {brand.siteName}
            </p>
            <h1 className="mx-auto max-w-[20ch] font-heading text-[44px] font-semibold leading-[1.08] tracking-[-0.015em] text-ink md:text-[56px]">
              {brand.tagline}
            </h1>
            <p className="mx-auto mt-5 max-w-[44ch] text-[18px] leading-[1.45] text-ink-80">
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
        </div>
      </section>

      {/* ---- Marquee strip ----
          Dark full-bleed band with a CSS-only horizontal scrolling keyword
          list. Pause on hover; respects prefers-reduced-motion. */}
      <div className="diag-full-bleed">
        <div className="bg-tile-1">
          <div className="marquee py-5 text-ink-ondark">
            <div className="marquee-track gap-12 whitespace-nowrap px-6 text-[14px] uppercase tracking-[0.18em] text-ink-dim">
              {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
                <span key={`${word}-${i}`} className="inline-flex items-center gap-12">
                  <span>{word}</span>
                  <span aria-hidden="true" className="text-primary-ondark">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Intro ----
          Avatar + greeting + bio. Avatar gets a thin brand ring. */}
      <Tile tone="light">
        <Container width="wide" className="py-section">
          <div className="mx-auto grid max-w-[760px] grid-cols-1 items-start gap-8 md:grid-cols-[180px_1fr]">
            <div className="flex justify-center md:justify-start">
              <div className="rounded-full p-[3px] ring-1 ring-primary/40">
                <Image
                  src="/avatar-placeholder.svg"
                  alt={`${brand.siteName} — ảnh đại diện`}
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px] rounded-full"
                />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="mb-3 font-heading text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                Xin Chào!
              </h2>
              <div className="space-y-4 text-[16px] leading-[1.6] text-ink-80">
                <p>
                  Cảm ơn bạn đã ghé thăm website <em className="font-semibold not-italic text-ink">{brand.siteName}</em>.
                  Đây là một &ldquo;khu vườn xanh yên tĩnh&rdquo; — nơi ghi lại những điều
                  mới mẻ, suy ngẫm và những tầm hồn mình muốn lưu giữ sau mỗi
                  hành trình.
                </p>
                <p>
                  <em className="font-semibold not-italic text-ink">{brand.siteName}</em> được sáng tạo bởi{' '}
                  <Link href="/gioi-thieu" className="text-primary underline-offset-4 hover:underline">
                    đội ngũ biên tập
                  </Link>{' '}
                  — những người yêu việc kể chuyện bằng hình ảnh và con chữ.
                </p>
                <p>
                  Blog ra mắt từ năm 2016 và dần phát triển thành kênh{' '}
                  <strong className="font-semibold text-ink">YouTube</strong> và{' '}
                  <strong className="font-semibold text-ink">Podcast</strong> về cuộc sống,
                  phát triển bản thân và nghệ thuật ứng dụng.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Tile>

      {/* ---- Categories grid ----
          White background, hairline-bordered cards so visitors get a quick
          map of the topic space. */}
      {categories.length > 0 && (
        <Tile tone="light">
          <Container width="wide" className="py-section">
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="text-d-sm">Chủ đề</h2>
              <Link href="/chu-de" className="text-[15px] text-primary hover:underline">
                Xem tất cả ›
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="rounded-18 border border-hairline bg-canvas p-6 transition-colors hover:bg-canvas-parchment"
                >
                  <Link href={`/chu-de/${c.slug}`} className="block">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="block text-[21px] font-semibold tracking-tight text-ink hover:text-primary">
                        {c.name}
                      </span>
                      <span className="text-[12px] uppercase tracking-[0.08em] text-ink-48">
                        {c.count} bài
                      </span>
                    </div>
                    {c.description && (
                      <p className="mt-3 text-[15px] leading-snug text-ink-80 line-clamp-3">
                        {c.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Tile>
      )}

      {/* ---- Featured posts ----
          Dark band. One large hero card + two smaller side cards so the
          block reads as a magazine cover, not a uniform row. */}
      {featured.length > 0 && (
        <Tile tone="dark">
          <Container width="wide" className="py-section">
            <h2 className="mb-8 text-d-sm text-ink-ondark">Bài nổi bật</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {heroPost && (
                <article className="rounded-18 bg-tile-2 p-8 transition-colors hover:bg-tile-3 md:col-span-2">
                  <p className="mb-3 text-[12px] uppercase tracking-[0.08em] text-ink-dim">
                    Nổi bật
                  </p>
                  <h3 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink-ondark">
                    <Link href={`/blog/${heroPost.slug}`} className="hover:text-primary-ondark">
                      {heroPost.title}
                    </Link>
                  </h3>
                  {heroPost.publishedAt && (
                    <time
                      dateTime={heroPost.publishedAt.toISOString()}
                      className="mt-3 block text-[12px] uppercase tracking-[0.08em] text-ink-dim"
                    >
                      {new Intl.DateTimeFormat('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).format(heroPost.publishedAt)}
                    </time>
                  )}
                  {heroPost.excerpt && (
                    <p className="mt-4 text-[15px] leading-[1.55] text-ink-dim">
                      {heroPost.excerpt}
                    </p>
                  )}
                </article>
              )}
              {sidePosts.map((p) => (
                <PostCard key={p.id} post={p} variant="card" tone="ondark" />
              ))}
            </div>
          </Container>
        </Tile>
      )}

      {/* ---- Latest posts ----
          Row variant on light tile, hairline dividers. */}
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