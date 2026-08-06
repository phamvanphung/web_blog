// app/(site)/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Tile } from '@/components/ui/Tile';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PostCard } from '@/components/site/PostCard';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { listFeaturedPosts, listPublishedPosts } from '@/modules/posts/server/public';
import { websiteJsonLd, organizationJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: '9ent — Blog công ty',
  description:
    'Show dự án, chia sẻ quá trình làm. Nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi làm việc.',
  path: '/'
});

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export default async function HomePage() {
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

  return (
    <>
      <JsonLd data={websiteJsonLd({ name: '9ent', url: APP_URL })} />
      <JsonLd
        data={organizationJsonLd({
          name: '9ent',
          url: APP_URL,
          logo: `${APP_URL}/logo.svg`
        })}
      />

      {/* Hero — parchment full-bleed band */}
      <Tile tone="parchment">
        <Container width="wide" className="py-section text-center">
          <p className="mb-4 text-[13px] uppercase tracking-[0.08em] text-ink-48">
            9ent.vn
          </p>
          {/* h1 text MUST stay "Blog công ty 9ent" — asserted by tests/e2e/home.spec.ts */}
          <h1 className="mx-auto max-w-[16ch] text-d-lg text-ink">Blog công ty 9ent</h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[21px] leading-[1.38] text-ink-80">
            Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng
            thấy cách chúng tôi làm việc.
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
                <PostCard
                  key={p.id}
                  post={p}
                  variant="card"
                  tone="ondark"
                />
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
            <Link
              href="/blog"
              className="text-[15px] text-primary hover:underline"
            >
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
