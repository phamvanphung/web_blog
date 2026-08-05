// lib/storage.ts
// Storage helpers (local filesystem). Real implementation arrives in P2 (Media).
//
// Cross-platform rules:
//   - Never hardcode OS-specific paths in source.
//   - Storage root is read from process.env.UPLOAD_ROOT and resolved via node:path
//     at call time (so it adapts to whatever cwd the process is started from).
//   - Set UPLOAD_ROOT in the environment to override the default at deploy time.

import path from 'node:path';

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
 * STUB: throws until P2 ships. P2 will fill in the Sharp pipeline.
 */
export class LocalDiskStorage implements StorageAdapter {
  async save(_buffer: Buffer, _originalName: string, _mime: string): Promise<UploadResult> {
    throw new Error('LocalDiskStorage.save not implemented (P2)');
  }
  async delete(_path: string): Promise<void> {
    throw new Error('LocalDiskStorage.delete not implemented (P2)');
  }
}

export const storage = {
  getUploadRoot,
  getUploadPublicBase,
  buildStoragePath
};

export default storage;
