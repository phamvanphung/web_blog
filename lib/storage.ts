// lib/storage.ts
// Storage helpers (local filesystem). Storage path is always posix-style
// (YYYY/MM/<name>) for cross-platform DB portability; FS ops join with
// OS-native separators via node:path at call time.
//
// Cross-platform rules:
//   - Never hardcode OS-specific paths in source.
//   - Storage root is read from process.env.UPLOAD_ROOT and resolved via node:path
//     at call time (so it adapts to whatever cwd the process is started from).
//   - Set UPLOAD_ROOT in the environment to override the default at deploy time.

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MAX_UPLOAD_BYTES } from '@/modules/media/types';

export { MAX_UPLOAD_BYTES };

const DEFAULT_ROOT = './storage/uploads';

/** Resolve the absolute filesystem root for uploads. Cross-OS safe. */
export function getUploadRoot(): string {
  const raw = process.env.UPLOAD_ROOT ?? DEFAULT_ROOT;
  return path.resolve(process.cwd(), raw);
}

/** Public URL prefix where uploads are served (Nginx static in production). */
export function getUploadPublicBase(): string {
  return process.env.UPLOAD_PUBLIC_BASE ?? '/uploads';
}

/**
 * Build the relative disk path for a stored upload file.
 * Format: YYYY/MM/<name> (year/month derived from current date UTC).
 * Uses posix separators so the value is stable across Windows/Linux.
 */
export function pathForUpload(storedName: string): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return path.posix.join(year, month, storedName);
}

/** Generate a unique stored filename. */
export function newStoredName(ext = 'webp'): string {
  return `${randomUUID()}.${ext}`;
}

/** Public URL for a stored upload. Uses UPLOAD_PUBLIC_BASE (defaults to /uploads). */
export function publicUrlFor(storedName: string): string {
  const base = getUploadPublicBase().replace(/\/$/, '');
  return `${base}/${pathForUpload(storedName)}`.replace(/\\/g, '/');
}

// ============================================================
// Notes on the (removed) StorageAdapter interface
// ============================================================
//
// An earlier revision of this file exported a `StorageAdapter` interface
// plus a `LocalDiskStorage` class implementing it. The class was never
// wired in — `uploadMediaAction` calls `writeFile` directly via
// `getUploadRoot` + `pathForUpload` + `publicUrlFor`. Grep confirms no
// other consumer imports `LocalDiskStorage`, `StorageAdapter`, or
// `UploadResult`. The class is dead code on the upload path and is
// preserved here only as a future hook for swapping in S3/R2.

export const storage = {
  getUploadRoot,
  getUploadPublicBase,
  pathForUpload,
  newStoredName,
  publicUrlFor,
  MAX_UPLOAD_BYTES
};

export default storage;
