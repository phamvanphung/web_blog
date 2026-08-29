// components/site/PostCard.tsx
//
// Presentation primitive for a single Post on the public site. Four variants:
//   - 'row'              : text-only horizontal divider (existing blog list)
//   - 'card'             : text-only tile (existing featured grid)
//   - 'list-with-image'  : horizontal row with thumbnail on the left
//   - 'grid-with-image'  : vertical card with image on top
//
// `showImage` / `showTitle` / `showExcerpt` are honored only by the
// image-bearing variants; 'row' and 'card' never render an image area so
// `showImage` is ignored for them. Defaults: image on (when variant has an
// image slot), title on, excerpt on.

import Link from 'next/link';
import type { Post } from '@prisma/client';

type Variant = 'row' | 'card' | 'list-with-image' | 'grid-with-image';
type Tone = 'ink' | 'ondark';

type PostMedia = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

type Props = {
  post: Pick<Post, 'title' | 'slug' | 'excerpt' | 'publishedAt'> & {
    featuredMedia?: PostMedia | null;
  };
  hrefPrefix?: string; // default '/blog'
  variant?: Variant; // default 'row'
  tone?: Tone; // default 'ink'
  showImage?: boolean; // default true for image-bearing variants
  showTitle?: boolean; // default true
  showExcerpt?: boolean; // default true
};

const DATE_FMT = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const HAS_IMAGE_SLOT = (v: Variant): boolean =>
  v === 'list-with-image' || v === 'grid-with-image';

export function PostCard({
  post,
  hrefPrefix = '/blog',
  variant = 'row',
  tone = 'ink',
  showImage,
  showTitle = true,
  showExcerpt = true
}: Props) {
  const isDark = tone === 'ondark';
  const showImageResolved = HAS_IMAGE_SLOT(variant) && (showImage ?? true) && post.featuredMedia !== null;

  if (variant === 'card') {
    return (
      <article
        className={
          'rounded-18 p-6 transition-colors ' +
          (isDark ? 'bg-tile-2 hover:bg-tile-3' : 'bg-canvas-parchment hover:bg-chip')
        }
      >
        {showTitle && (
          <h3 className={'mb-2 text-[21px] font-semibold tracking-tight ' + (isDark ? 'text-ink-ondark' : 'text-ink')}>
            <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
              {post.title}
            </Link>
          </h3>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className={'text-[12px] uppercase tracking-[0.08em] ' + (isDark ? 'text-ink-dim' : 'text-ink-48')}
          >
            {DATE_FMT.format(post.publishedAt)}
          </time>
        )}
        {showExcerpt && post.excerpt && (
          <p className={'mt-3 text-[15px] leading-snug ' + (isDark ? 'text-ink-dim' : 'text-ink-80')}>
            {post.excerpt}
          </p>
        )}
      </article>
    );
  }

  if (variant === 'list-with-image') {
    return (
      <article className="flex gap-4 border-b border-hairline py-6">
        {showImageResolved && post.featuredMedia && (
          <Link
            href={`${hrefPrefix}/${post.slug}`}
            className="block shrink-0"
            aria-label={post.featuredMedia.altText ?? post.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredMedia.url}
              alt={post.featuredMedia.altText ?? ''}
              width={post.featuredMedia.width ?? 128}
              height={post.featuredMedia.height ?? 96}
              className="h-24 w-32 rounded-8 object-cover"
              loading="lazy"
            />
          </Link>
        )}
        <div className="flex-1">
          {showTitle && (
            <h3 className="mb-2 text-[21px] font-semibold tracking-tight text-ink">
              <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
                {post.title}
              </Link>
            </h3>
          )}
          {post.publishedAt && (
            <time
              dateTime={post.publishedAt.toISOString()}
              className="text-[12px] uppercase tracking-[0.08em] text-ink-48"
            >
              {DATE_FMT.format(post.publishedAt)}
            </time>
          )}
          {showExcerpt && post.excerpt && (
            <p className="mt-3 text-[15px] leading-snug text-ink-80">{post.excerpt}</p>
          )}
        </div>
      </article>
    );
  }

  if (variant === 'grid-with-image') {
    return (
      <article className="rounded-18 bg-canvas-parchment p-4 transition-colors hover:bg-chip">
        {showImageResolved && post.featuredMedia && (
          <Link
            href={`${hrefPrefix}/${post.slug}`}
            className="mb-3 block overflow-hidden rounded-11"
            aria-label={post.featuredMedia.altText ?? post.title}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredMedia.url}
              alt={post.featuredMedia.altText ?? ''}
              width={post.featuredMedia.width ?? 640}
              height={post.featuredMedia.height ?? 360}
              className="aspect-video w-full object-cover"
              loading="lazy"
            />
          </Link>
        )}
        {showTitle && (
          <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-ink">
            <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
              {post.title}
            </Link>
          </h3>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-[12px] uppercase tracking-[0.08em] text-ink-48"
          >
            {DATE_FMT.format(post.publishedAt)}
          </time>
        )}
        {showExcerpt && post.excerpt && (
          <p className="mt-3 text-[14px] leading-snug text-ink-80 line-clamp-3">{post.excerpt}</p>
        )}
      </article>
    );
  }

  // variant === 'row'
  return (
    <article className="border-b border-hairline py-6">
      {showTitle && (
        <h3 className="mb-2 text-[21px] font-semibold tracking-tight">
          <Link href={`${hrefPrefix}/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
      )}
      {post.publishedAt && (
        <time
          dateTime={post.publishedAt.toISOString()}
          className="text-[12px] uppercase tracking-[0.08em] text-ink-48"
        >
          {DATE_FMT.format(post.publishedAt)}
        </time>
      )}
      {showExcerpt && post.excerpt && <p className="mt-3 text-[15px] leading-snug text-ink-80">{post.excerpt}</p>}
    </article>
  );
}