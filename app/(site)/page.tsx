// app/(site)/page.tsx
// Editorial home — watercolor hero + author intro + (optional) featured/recent.
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
import { websiteJsonLd, organizationJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 60;

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

      {/* Hero — full-width watercolor-style backdrop with overlaid title.
          Replace /public/hero-placeholder.svg with the final artwork. */}
      <section className="relative isolate overflow-hidden bg-canvas-parchment">
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
          {/* Display headline — editorial serif/sans pairing */}
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
      </section>

      {/* Intro — circular avatar + greeting + bio */}
      <Tile tone="light">
        <Container width="wide" className="py-section">
          {/* Social row above the avatar — kept narrow so it doesn't drift */}
          <ul className="mb-8 flex justify-center gap-5 text-ink-48">
            {[
              { label: 'Bài viết', href: '/blog' },
              { label: 'Facebook', href: 'https://facebook.com' },
              { label: 'YouTube', href: 'https://youtube.com' },
              { label: 'Instagram', href: 'https://instagram.com' },
              { label: 'TikTok', href: 'https://tiktok.com' }
            ].map((it) => (
              <li key={it.href}>
                <a
                  href={it.href}
                  target={it.href.startsWith('http') ? '_blank' : undefined}
                  rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-[14px] transition-colors hover:text-primary"
                  aria-label={it.label}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mx-auto grid max-w-[760px] grid-cols-1 items-start gap-8 md:grid-cols-[180px_1fr]">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/avatar-placeholder.svg"
                alt={`${brand.siteName} — ảnh đại diện`}
                width={180}
                height={180}
                className="h-[180px] w-[180px] rounded-full"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="mb-3 font-heading text-[28px] font-semibold leading-tight tracking-[-0.01em] text-ink">
                Xin Chào!
              </h2>
              <div className="space-y-4 text-[16px] leading-[1.6] text-ink-80">
                <p>
                  Cảm ơn bạn đã ghé thăm website <em className="font-semibold not-italic text-ink">{brand.siteName}</em>.
                  Đây là một “khu vườn xanh yên tĩnh” — nơi ghi lại những điều
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
                  <strong className="font-semibold text-ink">Youtube</strong> và{' '}
                  <strong className="font-semibold text-ink">Podcast</strong> về cuộc sống,
                  phát triển bản thân và nghệ thuật ứng dụng.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Tile>

      {/* Featured — dark tile band (kept from the previous layout) */}
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
