// components/site/PostCard.tsx
import Link from 'next/link';
import type { Post } from '@prisma/client';

type Variant = 'row' | 'card';
type Tone = 'ink' | 'ondark';

type Props = {
  post: Pick<Post, 'title' | 'slug' | 'excerpt' | 'publishedAt'>;
  hrefPrefix?: string; // default '/blog'
  variant?: Variant; // default 'row'
  tone?: Tone; // default 'ink'
};

const DATE_FMT = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

export function PostCard({
  post,
  hrefPrefix = '/blog',
  variant = 'row',
  tone = 'ink'
}: Props) {
  const isDark = tone === 'ondark';

  if (variant === 'card') {
    return (
      <article
        className={
          'rounded-18 p-6 transition-colors ' +
          (isDark ? 'bg-tile-2 hover:bg-tile-3' : 'bg-canvas-parchment hover:bg-chip')
        }
      >
        <h3 className={'mb-2 text-[21px] font-semibold tracking-tight ' + (isDark ? 'text-ink-ondark' : 'text-ink')}>
          <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className={'text-[12px] uppercase tracking-[0.08em] ' + (isDark ? 'text-ink-dim' : 'text-ink-48')}
          >
            {DATE_FMT.format(post.publishedAt)}
          </time>
        )}
        {post.excerpt && (
          <p className={'mt-3 text-[15px] leading-snug ' + (isDark ? 'text-ink-dim' : 'text-ink-80')}>
            {post.excerpt}
          </p>
        )}
      </article>
    );
  }

  // variant === 'row'
  return (
    <article className="border-b border-hairline py-6">
      <h3 className="mb-2 text-[21px] font-semibold tracking-tight">
        <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
          {post.title}
        </Link>
      </h3>
      {post.publishedAt && (
        <time
          dateTime={post.publishedAt.toISOString()}
          className="text-[12px] uppercase tracking-[0.08em] text-ink-48"
        >
          {DATE_FMT.format(post.publishedAt)}
        </time>
      )}
      {post.excerpt && <p className="mt-3 text-[15px] leading-snug text-ink-80">{post.excerpt}</p>}
    </article>
  );
}
