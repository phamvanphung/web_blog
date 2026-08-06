// modules/media/server/paths.ts
// Pure helpers — no 'use server' directive so this file can export sync
// functions alongside async Server Actions in sibling files.
//
// Naming convention produced by upload.ts:
//   YYYY/MM/<uploadId>-<variant>.webp
// where <variant> ∈ { original, large, medium, thumb }.

import { MEDIA_VARIANTS, type MediaVariant } from '@/modules/media/types';

/**
 * Derive the disk paths of every variant that belongs to the same upload
 * as `originalPath`. Tolerates malformed input by always returning all 4
 * candidate paths — `rm({ force: true })` swallows ENOENT, so missing
 * legacy files are harmless.
 */
export function siblingPathsFor(originalPath: string): string[] {
  const sepIdx = originalPath.lastIndexOf('/');
  const baseStart = sepIdx >= 0 ? sepIdx + 1 : 0;
  const base = originalPath.slice(baseStart); // "<uuid>-<variant>.webp"
  const lastDash = base.lastIndexOf('-');
  const uuid = lastDash > 0 ? base.slice(0, lastDash) : '';
  const relDir = sepIdx >= 0 ? originalPath.slice(0, sepIdx + 1) : '';
  return (Object.keys(MEDIA_VARIANTS) as MediaVariant[]).map((v) =>
    `${relDir}${uuid}-${v}.webp`
  );
}
