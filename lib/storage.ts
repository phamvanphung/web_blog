// lib/storage.ts
// Storage helpers (local filesystem). Real implementation arrives in P2 (Media).
//
// Cross-platform rules (see .claude/projects/.../memory/cross-platform-windows-linux.md):
//   - Never hardcode "/srv/..." or "\\" in source.
//   - Storage root is read from process.env.UPLOAD_ROOT and resolved via node:path.
//   - On Windows local dev, UPLOAD_ROOT is a relative path like "./storage/uploads".
//   - On Linux VPS, UPLOAD_ROOT is overridden in .env to "/srv/9ent/storage/uploads".

import path from 'node:path';

const DEFAULT_ROOT = './storage/uploads';

function resolveRoot(): string {
  const raw = process.env.UPLOAD_ROOT ?? DEFAULT_ROOT;
  // path.resolve handles both relative ("...") and absolute ("/srv/...") inputs,
  // and normalises slashes per-OS. Safe on Win + Linux.
  return path.resolve(process.cwd(), raw);
}

export function getUploadRoot(): string {
  return resolveRoot();
}

export function getUploadPublicBase(): string {
  return process.env.UPLOAD_PUBLIC_BASE ?? '/uploads';
}

/**
 * Build an absolute filesystem path for a given stored name.
 * Real impl (P2) will sanitise the name, ensure it's inside the root,
 * and create year/month subdirectories. STUB for now.
 */
export function buildStoragePath(_storedName: string): string {
  return resolveRoot();
}

export const storage = {
  getUploadRoot,
  getUploadPublicBase,
  buildStoragePath
};

export default storage;
