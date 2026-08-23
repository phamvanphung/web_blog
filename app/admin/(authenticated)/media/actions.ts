'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { deleteMediaAction } from '@/modules/media/server/delete';

export async function deleteMediaFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteMediaAction(id);
  revalidatePath('/admin/media');
  // Media images appear in the category card via `categories:list` cache.
  revalidateTag('categories:list');
}

/**
 * Fetch the next page of media, ordered newest-first, that come after the
 * initial render batch already on screen.
 *
 * Used by `<MediaGrid>` (client component) for infinite-scroll. Returns a
 * plain serializable shape — `Date` is converted to ISO — because Server
 * Actions carry their return value across the RSC boundary as JSON.
 *
 * `skip` is the offset in the same `orderBy: createdAt desc` sequence the
 * initial SSR used. The Media model has only ~hundreds of rows in practice
 * (sketch ceiling ~10k), so a skip-based query stays fast — switching to
 * cursor pagination is a future-only concern.
 */
export async function loadMoreMediaAction(skip: number): Promise<{
  items: Array<{
    id: string;
    url: string;
    altText: string | null;
    originalName: string;
    width: number | null;
    height: number | null;
    fileSize: number;
    createdAt: string;
  }>;
  hasMore: boolean;
}> {
  const PAGE = 60;
  const safeSkip = Math.max(0, Math.floor(Number(skip) || 0));
  // Take one extra to detect if more pages remain.
  const rows = await db.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: PAGE + 1,
    skip: safeSkip,
    select: {
      id: true,
      url: true,
      altText: true,
      originalName: true,
      width: true,
      height: true,
      fileSize: true,
      createdAt: true
    }
  });
  const hasMore = rows.length > PAGE;
  const items = (hasMore ? rows.slice(0, PAGE) : rows).map((m) => ({
    id: m.id,
    url: m.url,
    altText: m.altText,
    originalName: m.originalName,
    width: m.width,
    height: m.height,
    fileSize: m.fileSize,
    createdAt: m.createdAt.toISOString()
  }));
  return { items, hasMore };
}

