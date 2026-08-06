// modules/posts/server/public.ts
// Public read-only access to Posts. Excludes DRAFT/TRASHED/HIDDEN + deletedAt.

import { db } from '@/lib/db';

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

export async function listPublishedPosts(opts: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
  featured?: boolean;
} = {}) {
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
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPublishedPostBySlug(slug: string) {
  const post = await db.post.findUnique({
    where: { slug },
    select: PUBLIC_SELECT
  });
  if (!post || post.status !== 'PUBLISHED' || post.deletedAt !== null) return null;
  return post;
}

export async function listFeaturedPosts(limit = 3) {
  return db.post.findMany({
    where: { ...PUBLIC_BASE_WHERE, isFeatured: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: PUBLIC_SELECT
  });
}

export async function listRelatedPosts(postId: string, categoryIds: string[], limit = 3) {
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

export async function incrementViews(postId: string): Promise<void> {
  // Fire-and-forget; never throws to caller.
  await db.post
    .update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    })
    .catch(() => undefined);
}
