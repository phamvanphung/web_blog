// app/uploads/[...path]/route.ts
// Stream a file from UPLOAD_ROOT. Path traversal safe (rejects '..' segments and null bytes).
//
// In production (VPS Linux), Nginx serves /uploads/* directly and bypasses
// this route entirely — see P7 deploy notes.

import { getUploadRoot } from '@/lib/storage';
import { join, normalize, sep } from 'node:path';
import { createReadStream, statSync } from 'node:fs';
import { Readable } from 'node:stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIME_BY_EXT: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif'
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new Response('Bad request', { status: 400 });
  }
  // Path traversal check — any '..' segment must be rejected.
  if (segments.some((s) => s === '..' || s.includes('\0'))) {
    return new Response('Forbidden', { status: 403 });
  }
  const rel = segments.join('/');
  const root = normalize(getUploadRoot()) + sep;
  const abs = normalize(join(getUploadRoot(), rel));
  // Ensure resolved path is still under the upload root.
  if (!normalize(abs).startsWith(root)) {
    return new Response('Forbidden', { status: 403 });
  }
  let stat;
  try {
    stat = statSync(abs);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  if (!stat.isFile()) {
    return new Response('Not found', { status: 404 });
  }
  const ext = abs.slice(abs.lastIndexOf('.')).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream;
  return new Response(stream, {
    headers: {
      'content-type': contentType,
      'content-length': String(stat.size),
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
