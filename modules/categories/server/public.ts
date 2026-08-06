// modules/categories/server/public.ts
import { db } from '@/lib/db';

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function listCategoriesWithCounts() {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: {
          posts: {
            where: { post: { status: 'PUBLISHED', deletedAt: null } }
          }
        }
      }
    }
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    count: c._count.posts
  }));
}
