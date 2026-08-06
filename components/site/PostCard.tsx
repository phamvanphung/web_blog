// components/site/PostCard.tsx
import Link from 'next/link';
import type { Post } from '@prisma/client';

type Props = {
  post: Pick<Post, 'title' | 'slug' | 'excerpt' | 'publishedAt'>;
  hrefPrefix?: string; // default '/blog'
};

const DATE_FMT = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

export function PostCard({ post, hrefPrefix = '/blog' }: Props) {
  return (
    <article className="border-b border-line py-6">
      <h2 className="mb-2 text-2xl">
        <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      {post.publishedAt && (
        <time
          dateTime={post.publishedAt.toISOString()}
          className="text-xs uppercase tracking-wider text-muted"
        >
          {DATE_FMT.format(post.publishedAt)}
        </time>
      )}
      {post.excerpt && <p className="mt-3 text-muted">{post.excerpt}</p>}
    </article>
  );
}
