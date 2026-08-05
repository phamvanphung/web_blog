import type { Media } from '@prisma/client';

export type MediaVariant = 'original' | 'large' | 'medium' | 'thumb';

export type MediaItem = Media;

export const MEDIA_VARIANTS: Record<MediaVariant, { width: number; quality: number }> = {
  original: { width: 0, quality: 90 },
  large: { width: 1600, quality: 82 },
  medium: { width: 800, quality: 82 },
  thumb: { width: 400, quality: 80 }
};

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
