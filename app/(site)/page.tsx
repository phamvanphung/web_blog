// app/(site)/page.tsx
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { PostCard } from '@/components/site/PostCard';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { listFeaturedPosts, listPublishedPosts } from '@/modules/posts/server/public';
import { websiteJsonLd, organizationJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: '9ent — Blog công ty',
  description:
    'Show dự án, chia sẻ quá trình làm. Nơi khách hàng hiện hữu và tiềm năng thấy cách 9ent làm việc.',
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
    <Container width="wide" className="py-16">
      <JsonLd data={websiteJsonLd({ name: '9ent', url: APP_URL })} />
      <JsonLd
        data={organizationJsonLd({
          name: '9ent',
          url: APP_URL,
          logo: `${APP_URL}/logo.svg`
        })}
      />

      <section className="mb-16">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted">9ent.vn</p>
        <h1 className="mb-6 text-5xl leading-tight">Blog công ty 9ent</h1>
        <p className="max-w-prose text-lg text-muted">
          Show dự án, chia sẻ quá trình làm — nơi khách hàng hiện hữu và tiềm năng thấy cách chúng tôi
          làm việc.
        </p>
      </section>

      {featured.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-4 text-2xl">Bài nổi bật</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featured.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl">Mới nhất</h2>
        {recent.rows.length === 0 ? (
          <p className="text-muted">Chưa có bài viết nào.</p>
        ) : (
          recent.rows.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </section>
    </Container>
  );
}
