// app/api/posts/draft/route.ts
// POST /api/posts/draft — autosave endpoint for the Tiptap editor (Task 3.6).
// Admin-only. Accepts { id?: string|null, title: string, contentJson: unknown }.
// Returns { id: string } on success.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createDraft, updateDraft } from '@/modules/posts/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  id: z.string().nullable().optional(),
  title: z.string().max(255),
  contentJson: z.unknown()
});

export async function POST(req: Request): Promise<Response> {
  const me = await requireRole('ADMIN');

  let parsed;
  try {
    const json = await req.json();
    parsed = Body.safeParse(json);
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let postId: string;
  if (!parsed.data.id) {
    // First save: create new draft.
    postId = await createDraft({
      title: parsed.data.title || 'Untitled',
      contentJson: parsed.data.contentJson
    });
  } else {
    // Subsequent save: update existing draft.
    await updateDraft({
      id: parsed.data.id,
      title: parsed.data.title || undefined,
      contentJson: parsed.data.contentJson
    });
    postId = parsed.data.id;
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.autosave',
    target: 'Post',
    targetId: postId,
    ipHash: await hashIp(ip)
  });

  return NextResponse.json({ id: postId }, { status: 200 });
}
