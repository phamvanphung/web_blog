// lib/image.ts
// One-call Sharp pipeline: validate MIME, EXIF-rotate, generate 4 WebP variants.
// Server-only.

import sharp from 'sharp';
import { MEDIA_VARIANTS, type MediaVariant } from '@/modules/media/types';

export const ALLOWED_MIME_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

export type ProcessResult = {
  variants: Record<MediaVariant, { buffer: Buffer; width: number; height: number }>;
  originalWidth: number;
  originalHeight: number;
};

/**
 * Run the 4-variant pipeline and return all buffers + dimensions.
 * Throws on unsupported MIME.
 */
export async function processImage(input: Buffer, mime: string): Promise<ProcessResult> {
  if (!ALLOWED_MIME_SET.has(mime)) {
    throw new Error(`Unsupported MIME type: ${mime}`);
  }

  const base = sharp(input, { failOn: 'error' }).rotate();
  const meta = await base.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;

  const variants = {} as ProcessResult['variants'];

  for (const variant of Object.keys(MEDIA_VARIANTS) as MediaVariant[]) {
    const cfg = MEDIA_VARIANTS[variant];
    let pipeline = sharp(input).rotate();
    if (cfg.width > 0) {
      pipeline = pipeline.resize({ width: cfg.width, withoutEnlargement: true });
    }
    const { data, info } = await pipeline
      .webp({ quality: cfg.quality })
      .toBuffer({ resolveWithObject: true });
    variants[variant] = {
      buffer: data,
      width: info.width,
      height: info.height
    };
  }

  return { variants, originalWidth, originalHeight };
}
