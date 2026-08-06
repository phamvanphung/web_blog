// modules/tags/server/public.ts
import { db } from '@/lib/db';

export async function getTagBySlug(slug: string) {
  return db.tag.findUnique({ where: { slug } });
}

export async function listTagsWithCounts() {
  const rows = await db.tag.findMany({
    orderBy: { name: 'asc' },
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
  return rows
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.posts }))
    .filter((t) => t.count > 0);
}
