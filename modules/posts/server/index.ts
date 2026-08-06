// modules/posts/server/index.ts
// Posts module: queries, slug helpers, CRUD.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { jsonToHtml, jsonToText } from './render';

/** Title → slug. Falls back to 'post' if slugify yields empty. */
export function postSlugFromTitle(title: string): string {
  return slugify(title) || 'post';
}

/**
 * Given a base slug + exists() predicate, return a unique slug.
 * Caller passes the DB predicate (e.g. `s => db.post.findUnique({where:{slug:s, NOT:{id}}).then(Boolean)`).
 */
export async function ensureUniquePostSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`ensureUniquePostSlug: exhausted suffixes for "${base}"`);
}

/* ---------- DB queries (read-only — mutations in Task 3.5) ---------- */

export async function listPosts(
  opts: {
    status?: 'DRAFT' | 'PENDING' | 'SCHEDULED' | 'PUBLISHED' | 'HIDDEN' | 'TRASHED';
    take?: number;
    skip?: number;
  } = {}
) {
  const { status, take = 20, skip = 0 } = opts;
  return db.post.findMany({
    where: { ...(status ? { status } : {}), deletedAt: null },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take,
    skip,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true
    }
  });
}

export async function getPost(idOrSlug: string) {
  // Lookup by id first, then slug.
  const byId = await db.post.findUnique({ where: { id: idOrSlug } });
  if (byId) return byId;
  return db.post.findUnique({ where: { slug: idOrSlug } });
}

export async function postSlugExists(slug: string, excludePostId?: string): Promise<boolean> {
  const found = await db.post.findUnique({ where: { slug } });
  return !!found && found.id !== excludePostId;
}

/* ---------- CRUD (Task 3.5) ---------- */

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  contentJson: z.unknown()
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  contentJson: z.unknown().optional()
});

export async function createDraft(input: { title: string; contentJson: unknown }): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const baseSlug = postSlugFromTitle(parsed.data.title);
  const slug = await ensureUniquePostSlug(baseSlug, (s) => postSlugExists(s));

  const html = jsonToHtml(parsed.data.contentJson);
  const text = jsonToText(parsed.data.contentJson);

  const post = await db.post.create({
    data: {
      title: parsed.data.title,
      slug,
      contentJson: parsed.data.contentJson as object,
      contentHtml: html,
      contentText: text,
      authorId: me.id,
      status: 'DRAFT',
      allowComments: false,
      isFeatured: false
    }
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.create',
    target: 'Post',
    targetId: post.id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/posts');
  return post.id;
}

export async function updateDraft(input: {
  id: string;
  title?: string;
  contentJson?: unknown;
}): Promise<void> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const existing = await db.post.findUnique({ where: { id: parsed.data.id } });
  if (!existing) throw new Error('Post not found');

  const titleChanged = parsed.data.title !== undefined && parsed.data.title !== existing.title;

  await db.post.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.contentJson !== undefined
        ? {
            contentJson: parsed.data.contentJson as object,
            contentHtml: jsonToHtml(parsed.data.contentJson),
            contentText: jsonToText(parsed.data.contentJson)
          }
        : {})
    }
  });

  // Slug-change → 301 redirect
  if (titleChanged) {
    const newSlug = postSlugFromTitle(parsed.data.title!);
    const finalSlug = await ensureUniquePostSlug(newSlug, async (s) =>
      postSlugExists(s, parsed.data.id)
    );
    if (finalSlug !== existing.slug) {
      const oldUrl = `/blog/${existing.slug}`;
      const newUrl = `/blog/${finalSlug}`;
      await db.redirect
        .upsert({
          where: { fromPath: oldUrl },
          update: { toPath: newUrl, postId: parsed.data.id },
          create: {
            fromPath: oldUrl,
            toPath: newUrl,
            statusCode: 301,
            postId: parsed.data.id
          }
        })
        .catch(() => null);
      await db.post.update({ where: { id: parsed.data.id }, data: { slug: finalSlug } });
    }
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.update',
    target: 'Post',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${parsed.data.id}/edit`);
}

export async function publishPost(id: string): Promise<void> {
  const me = await requireRole('ADMIN');

  const existing = await db.post.findUnique({ where: { id } });
  if (!existing) throw new Error('Post not found');

  await db.postRevision.create({
    data: {
      postId: id,
      title: existing.title,
      contentJson: existing.contentJson as object,
      editorId: me.id
    }
  });
  await db.post.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: existing.publishedAt ?? new Date() }
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.publish',
    target: 'Post',
    targetId: id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/posts');
}

export async function deletePost(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  await db.post.update({
    where: { id },
    data: { status: 'TRASHED', deletedAt: new Date() }
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'post.delete',
    target: 'Post',
    targetId: id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/posts');
}
