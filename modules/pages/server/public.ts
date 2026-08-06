// modules/pages/server/public.ts
import { db } from '@/lib/db';

export async function getPublishedPageBySlug(slug: string) {
  const page = await db.page.findUnique({ where: { slug } });
  if (!page || page.status !== 'PUBLISHED') return null;
  return page;
}

export async function listPublishedPages() {
  return db.page.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, updatedAt: true }
  });
}
