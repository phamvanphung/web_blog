// modules/posts/server/public.ts
// Public read-only access to Posts. Excludes DRAFT/TRASHED/HIDDEN + deletedAt.

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { reviveDates } from '@/lib/cache/revive';

const PUBLIC_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  contentHtml: true,
  contentText: true,
  publishedAt: true,
  updatedAt: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  viewsCount: true,
  featuredMediaId: true,
  status: true,
  deletedAt: true,
  featuredMedia: {
    select: { id: true, url: true, altText: true, width: true, height: true }
  },
  author: { select: { id: true, name: true } },
  categories: {
    select: { category: { select: { id: true, name: true, slug: true } } }
  },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } }
} as const;

const PUBLIC_BASE_WHERE = { status: 'PUBLISHED' as const, deletedAt: null };

type ListOpts = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  featured?: boolean;
};

type ListResult = {
  rows: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    contentHtml: string;
    contentText: string;
    publishedAt: Date | null;
    updatedAt: Date;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalUrl: string | null;
    viewsCount: number;
    featuredMediaId: string | null;
    status: 'DRAFT' | 'PENDING' | 'SCHEDULED' | 'PUBLISHED' | 'HIDDEN' | 'TRASHED';
    deletedAt: Date | null;
    featuredMedia: { id: string; url: string; altText: string | null; width: number | null; height: number | null } | null;
    author: { id: string; name: string };
    categories: Array<{ category: { id: string; name: string; slug: string } }>;
    tags: Array<{ tag: { id: string; name: string; slug: string } }>;
  }>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

async function listPublishedPostsUncached(opts: ListOpts): Promise<ListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 12));
  const where = {
    ...PUBLIC_BASE_WHERE,
    ...(opts.categoryId
      ? { categories: { some: { categoryId: opts.categoryId } } }
      : {}),
    ...(opts.tagId ? { tags: { some: { tagId: opts.tagId } } } : {}),
    ...(opts.featured ? { isFeatured: true } : {})
  };
  const [rows, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_SELECT
    }),
    db.post.count({ where })
  ]);
  return { rows: rows as unknown as ListResult['rows'], total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * Cached variant of `listPublishedPosts`. Cache key encodes the normalized
 * options so different pages/filters don't collide. Tag `posts:list` purges
 * every variant on any post mutation.
 */
export function listPublishedPosts(opts: ListOpts = {}): Promise<ListResult> {
  const key = `posts:list:${JSON.stringify({
    page: opts.page ?? 1,
    pageSize: opts.pageSize ?? 12,
    categoryId: opts.categoryId ?? null,
    tagId: opts.tagId ?? null,
    featured: opts.featured ?? false
  })}`;
  return unstable_cache(
    async () => listPublishedPostsUncached(opts),
    [key],
    { tags: ['posts:list'], revalidate: 60 }
  )().then((data) => reviveDates(data));
}

// Inner `unstable_cache` (cross-request persistence, tagged `posts:detail:<slug>`)
// wrapped by outer `react.cache` (per-request dedup so generateMetadata + body share).
// `reviveDates` runs on every result — cache hits deserialise ISO strings without
// restoring `Date` prototypes, so we restore them here.
export const getPublishedPostBySlug = cache((slug: string) =>
  unstable_cache(
    async () => {
      const post = await db.post.findUnique({
        where: { slug },
        select: PUBLIC_SELECT
      });
      if (!post || post.status !== 'PUBLISHED' || post.deletedAt !== null) return null;
      return post;
    },
    ['posts:detail', slug],
    { tags: [`posts:detail:${slug}`], revalidate: 300 }
  )().then((data) => reviveDates(data))
);

async function listFeaturedPostsUncached(limit: number) {
  return db.post.findMany({
    where: { ...PUBLIC_BASE_WHERE, isFeatured: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: PUBLIC_SELECT
  });
}

/** Cached featured-posts helper. Tag `posts:featured`. */
export function listFeaturedPosts(limit = 3) {
  return unstable_cache(
    async () => listFeaturedPostsUncached(limit),
    ['posts:featured', String(limit)],
    { tags: ['posts:featured'], revalidate: 60 }
  )().then((data) => reviveDates(data));
}

async function listRelatedPostsUncached(postId: string, categoryIds: string[], limit: number) {
  if (categoryIds.length === 0) return [];
  return db.post.findMany({
    where: {
      ...PUBLIC_BASE_WHERE,
      id: { not: postId },
      categories: { some: { categoryId: { in: categoryIds } } }
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: PUBLIC_SELECT
  });
}

/** Cached related-posts helper.
 *
 * Tags:
 * - `posts:related:<postId>` — per-post tag, used by the post detail page
 *   to bust just its own related list when the source post changes
 *   categories / title.
 * - `posts:related` — shared family tag, invalidated by every post
 *   mutation (publish/unpublish/delete/setCategories/…). Any post can
 *   appear in any other post's related list, so without this shared tag
 *   we'd have to iterate every postId on every mutation to keep stale
 *   drafts from leaking into related lists after an unpublish.
 */
export function listRelatedPosts(postId: string, categoryIds: string[], limit = 3) {
  return unstable_cache(
    async () => listRelatedPostsUncached(postId, categoryIds, limit),
    ['posts:related', postId, String(limit)],
    { tags: [`posts:related:${postId}`, 'posts:related'], revalidate: 120 }
  )().then((data) => reviveDates(data));
}

export async function incrementViews(postId: string): Promise<void> {
  // Fire-and-forget; never throws to caller.
  await db.post
    .update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    })
    .catch(() => undefined);
}

type RecentOpts = {
  groupSlug?: string;
  limit: number;
};

/**
 * Cached "recent posts" helper for the public site. Used by the
 * `posts` CMS block (Section kind `posts`).
 *
 * - `groupSlug` is optional. When set, results are filtered to posts that
 *   belong to at least one Category where `category.groupId` matches the
 *   resolved CategoryGroup and `category.hidden = false`. The slug→id
 *   lookup happens INSIDE the cached function so it runs once per
 *   (groupSlug, limit) tuple.
 * - If the slug does not resolve, returns `[]` (the calling block then
 *   hides itself, so an unknown group never 500s the page).
 * - Sort is `publishedAt DESC`; `PUBLIC_BASE_WHERE` excludes drafts.
 * - Tag `posts:recent` invalidates the whole family on any post mutation.
 */
export function listRecentPosts(opts: RecentOpts) {
  const limit = Math.min(48, Math.max(1, opts.limit));
  const groupSlug = opts.groupSlug ?? null;
  const key = `posts:recent:${JSON.stringify({ groupSlug, limit })}`;
  return unstable_cache(
    async () => {
      const where = { ...PUBLIC_BASE_WHERE } as Record<string, unknown>;
      if (groupSlug) {
        const group = await db.categoryGroup.findUnique({ where: { slug: groupSlug } });
        if (!group) return [];
        where.categories = {
          some: { category: { groupId: group.id, hidden: false } }
        };
      }
      const rows = await db.post.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: PUBLIC_SELECT
      });
      return rows as unknown as ListResult['rows'];
    },
    [key],
    { tags: ['posts:recent'], revalidate: 60 }
  )().then((data) => reviveDates(data));
}
