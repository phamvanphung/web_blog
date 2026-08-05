'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { processImage, ALLOWED_MIME_SET } from '@/lib/image';
import { getUploadRoot, MAX_UPLOAD_BYTES, pathForUpload, publicUrlFor } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function uploadMediaAction(
  formData: FormData
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const me = await requireRole('ADMIN');

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'Không có file.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File quá lớn (>${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).` };
  }
  const mime = file.type;
  if (!ALLOWED_MIME_SET.has(mime)) {
    return { ok: false, error: `MIME không hỗ trợ: ${mime}.` };
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let processed;
  try {
    processed = await processImage(buf, mime);
  } catch (e) {
    return { ok: false, error: `Pipeline lỗi: ${(e as Error).message}` };
  }

  const root = getUploadRoot();
  const variantRecords: { variant: string; absPath: string; url: string; width: number; height: number; size: number }[] = [];

  for (const variantName of Object.keys(processed.variants) as Array<keyof typeof processed.variants>) {
    const v = processed.variants[variantName];
    const filename = `${variantName}.webp`;
    const storedName = `${randomUUID()}-${filename}`;
    const rel = pathForUpload(storedName);
    const abs = join(root, rel);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, v.buffer);
    variantRecords.push({
      variant: variantName,
      absPath: abs,
      url: publicUrlFor(storedName),
      width: v.width,
      height: v.height,
      size: v.buffer.byteLength
    });
  }

  const first = variantRecords[0]!;
  const record = await db.media.create({
    data: {
      originalName: file.name.slice(0, 255),
      storedName: first.absPath.split(/[\\/]/).pop() ?? 'upload.webp',
      path: first.absPath.slice(root.length + 1).replace(/\\/g, '/'),
      url: first.url,
      mimeType: 'image/webp',
      fileSize: first.size,
      width: processed.originalWidth,
      height: processed.originalHeight,
      altText: ((formData.get('altText') as string | null) ?? '').slice(0, 255) || null,
      caption: ((formData.get('caption') as string | null) ?? '').slice(0, 500) || null,
      uploadedById: me.id
    }
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'media.upload',
    target: 'Media',
    targetId: record.id,
    ipHash: await hashIp(ip),
    metadata: { originalName: file.name, variants: variantRecords.length, bytes: first.size }
  });

  revalidatePath('/admin/media');
  logger.info('media.upload', { id: record.id, userId: me.id });
  return { ok: true, id: record.id };
}
