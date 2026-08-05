import type { Post } from '@prisma/client';

export type PostWithRelations = Post & {
  author: { id: string; name: string; slug?: never };
  categories: { category: { id: string; name: string; slug: string } }[];
  tags: { tag: { id: string; name: string; slug: string } }[];
  featuredMedia: { id: string; url: string; altText: string | null } | null;
};
