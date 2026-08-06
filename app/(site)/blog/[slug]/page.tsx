// app/(site)/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { PostContent } from '@/components/site/PostContent';
import { PostMeta } from '@/components/site/PostMeta';
import { RelatedPosts } from '@/components/site/RelatedPosts';
import { JsonLd } from '@/components/site/JsonLd';
import { buildMetadata } from '@/lib/seo';
import {
  getPublishedPostBySlug,
  listRelatedPosts,
  incrementViews
} from '@/modules/posts/server/public';
import { findRedirectForPath } from '@/lib/redirects';
import { articleJsonLd, breadcrumbJsonLd } from '@/modules/seo/lib/jsonld';

export const revalidate = 300;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: 'Không tìm thấy' };
  const ogImage = post.featuredMedia?.url ?? null;
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? post.title,
    path: `/blog/${post.slug}`,
    ogImage: ogImage ?? undefined
  });
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = `/blog/${slug}`;
  const r = await findRedirectForPath(path);
  if (r) redirect(r.toPath);

  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Fire-and-forget view increment.
  void incrementViews(post.id);

  const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
  const url = `${APP_URL}${path}`;
  const categoryIds = post.categories.map((pc) => pc.category.id);
  const related = await listRelatedPosts(post.id, categoryIds, 3).catch(() => []);

  return (
    <Container width="prose" className="py-16">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt ?? post.title,
          url,
          datePublished: (post.publishedAt ?? post.updatedAt).toISOString(),
          authorName: post.author.name,
          imageUrl: post.featuredMedia?.url ?? null
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: `${APP_URL}/` },
          { name: 'Blog', url: `${APP_URL}/blog` },
          { name: post.title, url }
        ])}
      />

      <article>
        <h1 className="mb-4 text-4xl">{post.title}</h1>
        <PostMeta
          publishedAt={post.publishedAt}
          authorName={post.author.name}
          categories={post.categories.map((pc) => pc.category)}
          tags={post.tags.map((pt) => pt.tag)}
        />
        <PostContent html={post.contentHtml} />
      </article>

      <RelatedPosts
        posts={related.map((r) => ({
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          publishedAt: r.publishedAt
        }))}
      />
    </Container>
  );
}
