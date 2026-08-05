import type { Post } from '@prisma/client';

export type SearchHit = {
  post: Pick<Post, 'id' | 'title' | 'slug' | 'excerpt' | 'publishedAt' | 'featuredMediaId'>;
  snippet: string;
  score: number;
};

export type SearchQuery = {
  q: string;
  categoryId?: string;
  tagId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};
