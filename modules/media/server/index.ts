import { db } from '@/lib/db';

export async function listMedia(opts: { take?: number; skip?: number } = {}) {
  const { take = 60, skip = 0 } = opts;
  const [items, total] = await Promise.all([
    db.media.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip
    }),
    db.media.count()
  ]);
  return { items, total };
}

export async function getMedia(id: string) {
  return db.media.findUnique({ where: { id } });
}

export async function deleteMediaRecord(id: string) {
  return db.media.delete({ where: { id } });
}
