// lib/storage.ts
// Storage helpers (local filesystem). Real implementation arrives in P2 (Media).
//
// Cross-platform rules:
//   - Never hardcode OS-specific paths in source.
//   - Storage root is read from process.env.UPLOAD_ROOT and resolved via node:path
//     at call time (so it adapts to whatever cwd the process is started from).
//   - Set UPLOAD_ROOT in the environment to override the default at deploy time.

import path from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export { MAX_UPLOAD_BYTES } from '@/modules/media/types';
import { MAX_UPLOAD_BYTES } from '@/modules/media/types';

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
 * Build an absolute filesystem path for a given stored name.
 * Real impl (P2) will sanitise the name, ensure it's inside the root,
 * and create year/month subdirectories. STUB for now.
 */
export function buildStoragePath(_storedName: string): string {
  return getUploadRoot();
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
// StorageAdapter contract — implemented by P2 LocalDiskStorage
// (and optionally swapped for S3/R2 later).
// ============================================================

export interface UploadResult {
  storedName: string;
  path: string; // relative to UPLOAD_ROOT
  url: string;
  width?: number;
  height?: number;
  fileSize: number;
  mimeType: string;
}

export interface StorageAdapter {
  save(_buffer: Buffer, _originalName: string, _mime: string): Promise<UploadResult>;
  delete(_path: string): Promise<void>;
}

/**
 * Default local-disk storage adapter.
 * Writes buffers to UPLOAD_ROOT/<YYYY>/MM/<uuid>.webp via node:fs/promises.
 * Cross-OS safe: posix-style relative path from pathForUpload is joined with
 * OS-native separators by node:path for filesystem ops.
 */
export class LocalDiskStorage implements StorageAdapter {
  async save(buffer: Buffer, _originalName: string, _mime: string): Promise<UploadResult> {
    const ext = 'webp';
    const storedName = newStoredName(ext);
    const relPath = pathForUpload(storedName); // already uses posix joins — gives "YYYY/MM/<uuid>.webp"
    const absPath = join(getUploadRoot(), relPath); // join with OS separator for FS ops
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, buffer);
    return {
      storedName,
      path: relPath, // posix-style relative — DB stores this verbatim
      url: publicUrlFor(storedName), // "/uploads/YYYY/MM/<uuid>.webp"
      fileSize: buffer.byteLength,
      mimeType: 'image/webp'
    };
  }

  async delete(relPath: string): Promise<void> {
    const abs = join(getUploadRoot(), relPath);
    await rm(abs, { force: true }).catch(() => {});
  }
}

export const storage = {
  getUploadRoot,
  getUploadPublicBase,
  buildStoragePath,
  pathForUpload,
  newStoredName,
  publicUrlFor,
  MAX_UPLOAD_BYTES
};

export default storage;
