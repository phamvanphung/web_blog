'use server';

import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { getUploadRoot } from '@/lib/storage';
import { MEDIA_VARIANTS, type MediaVariant } from '@/modules/media/types';
import { logger } from '@/lib/logger';

/**
 * Derive the disk paths of every variant that belongs to the same upload
 * as `originalPath`. Expects the naming convention produced by `upload.ts`:
 * `YYYY/MM/<uuid>-<variant>.webp`.
 *
 * Returns posix-relative paths — same format used elsewhere in storage.
 * Cross-platform safe (joined to OS-native on disk via node:path).
 */
export function siblingPathsFor(originalPath: string): string[] {
  const sepIdx = originalPath.lastIndexOf('/');
  const baseStart = sepIdx >= 0 ? sepIdx + 1 : 0;
  const base = originalPath.slice(baseStart); // "<uuid>-<variant>.webp"
  const lastDash = base.lastIndexOf('-');
  if (lastDash <= 0) return [originalPath];
  const uuid = base.slice(0, lastDash);
  const relDir = sepIdx >= 0 ? originalPath.slice(0, sepIdx + 1) : '';
  return (Object.keys(MEDIA_VARIANTS) as MediaVariant[]).map((v) =>
    `${relDir}${uuid}-${v}.webp`
  );
}

/**
 * Delete every disk variant for `originalPath` then remove the Media DB row.
 * Tolerates missing files (idempotent — safe to call twice, no DB-only orphans).
 *
 * Backward-compat: media uploaded before the variant-naming fix
 * (randomUUID-per-variant) may not have siblings on disk — those rows
 * fall back to deleting whatever matches. `rm({ force: true })` swallows
 * ENOENT so the call stays safe.
 */
export async function deleteMediaAction(id: string): Promise<void> {
  const me = await requireRole('ADMIN');

  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;

  const paths = siblingPathsFor(media.path);
  const root = getUploadRoot();
  const results = await Promise.allSettled(
    paths.map((rel) => rm(join(root, rel), { force: true }))
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    logger.warn('media.delete.partial', { id, paths, failed });
  }

  await db.media.delete({ where: { id } });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'media.delete',
    target: 'Media',
    targetId: id,
    metadata: { variantsDeleted: paths.length, paths },
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/media');
}
