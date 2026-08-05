'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { LocalDiskStorage } from '@/lib/storage';

const storage = new LocalDiskStorage();

export async function deleteMediaAction(id: string): Promise<void> {
  const me = await requireRole('ADMIN');

  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;

  await storage.delete(media.path);
  await db.media.delete({ where: { id } });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'media.delete',
    target: 'Media',
    targetId: id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/media');
}
