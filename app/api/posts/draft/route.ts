// app/api/posts/draft/route.ts
// POST /api/posts/draft — save endpoint for the Tiptap editor (P5.1 manual save).
// Admin-only. Accepts { id?: string|null, title: string, contentJson: unknown,
//   categoryIds?: string[], tagIds?: string[], featuredMediaId?: string|null }.
// Returns { id: string } on success.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import {
  createDraft,
  updateDraft,
  setPostCategories,
  setPostTags,
  setFeaturedMedia
} from '@/modules/posts/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  id: z.string().nullable().optional(),
  title: z.string().max(255),
  contentJson: z.unknown(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  featuredMediaId: z.string().nullable().optional()
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
    postId = await createDraft({
      title: parsed.data.title || 'Untitled',
      contentJson: parsed.data.contentJson
    });
  } else {
    await updateDraft({
      id: parsed.data.id,
      title: parsed.data.title || undefined,
      contentJson: parsed.data.contentJson
    });
    postId = parsed.data.id;
  }

  // Apply taxonomy if provided.
  if (parsed.data.categoryIds) await setPostCategories(postId, parsed.data.categoryIds);
  if (parsed.data.tagIds) await setPostTags(postId, parsed.data.tagIds);
  if (parsed.data.featuredMediaId !== undefined) {
    await setFeaturedMedia(postId, parsed.data.featuredMediaId);
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.save',
    target: 'Post',
    targetId: postId,
    ipHash: await hashIp(ip)
  });

  return NextResponse.json({ id: postId }, { status: 200 });
}
