// modules/pages/server/index.ts
// Static pages (no Tiptap — plain text content).
// Admin-only CRUD; status enum DRAFT/PUBLISHED/HIDDEN (subset of PostStatus).

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { slugify } from '@/lib/slug';

/** Title → slug. Falls back to 'page' for empty result. */
export function pageSlugFromTitle(title: string): string {
  return slugify(title) || 'page';
}

/**
 * Given a base slug + exists() predicate, return a unique slug.
 * Excludes a pageId (for self-update collision avoidance).
 */
export async function ensureUniquePageSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`ensureUniquePageSlug: exhausted suffixes for "${base}"`);
}

/* ---------- DB queries ---------- */

export async function listPages(opts: {
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  take?: number;
  skip?: number;
} = {}) {
  const { status, take = 50, skip = 0 } = opts;
  return db.page.findMany({
    where: { ...(status ? { status } : {}) },
    orderBy: { updatedAt: 'desc' },
    take,
    skip,
    select: { id: true, title: true, slug: true, status: true, updatedAt: true }
  });
}

export async function getPage(idOrSlug: string) {
  const byId = await db.page.findUnique({ where: { id: idOrSlug } });
  if (byId) return byId;
  return db.page.findUnique({ where: { slug: idOrSlug } });
}

export async function pageSlugExists(slug: string, excludePageId?: string): Promise<boolean> {
  const found = await db.page.findUnique({ where: { slug } });
  return !!found && found.id !== excludePageId;
}

const StatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']);

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(50_000)
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(50_000).optional(),
  status: StatusEnum.optional()
});

/** Create a new Page (initially DRAFT) + slug uniqueness check. */
export async function createPage(input: { title: string; content: string }): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const baseSlug = pageSlugFromTitle(parsed.data.title);
  const slug = await ensureUniquePageSlug(baseSlug, (s) => pageSlugExists(s));

  const page = await db.page.create({
    data: {
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      authorId: me.id,
      status: 'DRAFT'
    }
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'page.create',
    target: 'Page',
    targetId: page.id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/pages');
  return page.id;
}

/** Update Page (partial). On title change, upserts a Redirect row + updates slug. */
export async function updatePage(input: {
  id: string;
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
}): Promise<void> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const existing = await db.page.findUnique({ where: { id: parsed.data.id } });
  if (!existing) throw new Error('Page not found');

  const titleChanged =
    parsed.data.title !== undefined && parsed.data.title !== existing.title;

  await db.page.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {})
    }
  });

  if (titleChanged) {
    const newSlug = pageSlugFromTitle(parsed.data.title!);
    const finalSlug = await ensureUniquePageSlug(newSlug, async (s) =>
      pageSlugExists(s, parsed.data.id)
    );
    if (finalSlug !== existing.slug) {
      const oldUrl = `/${existing.slug}`;
      const newUrl = `/${finalSlug}`;
      await db.redirect
        .upsert({
          where: { fromPath: oldUrl },
          update: { toPath: newUrl, postId: null, pageId: parsed.data.id },
          create: {
            fromPath: oldUrl,
            toPath: newUrl,
            statusCode: 301,
            pageId: parsed.data.id
          }
        })
        .catch(() => null);
      await db.page.update({ where: { id: parsed.data.id }, data: { slug: finalSlug } });
    }
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'page.update',
    target: 'Page',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${parsed.data.id}/edit`);
}

/** Delete a Page (hard delete). */
export async function deletePage(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  await db.page.delete({ where: { id } });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'page.delete',
    target: 'Page',
    targetId: id,
    ipHash: await hashIp(ip)
  });

  revalidatePath('/admin/pages');
}