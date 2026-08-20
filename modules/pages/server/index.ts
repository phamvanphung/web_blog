// modules/pages/server/index.ts
// Admin-only CRUD for Pages built from sections (Tiptap rich-text + structured blocks).
// status enum DRAFT/PUBLISHED/HIDDEN (subset of PostStatus).

import { z } from 'zod';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { slugify } from '@/lib/slug';
import { reviveDates } from '@/lib/cache/revive';
import type { Section } from '../types';
import { SectionsArraySchema } from '../schema';
import { deriveContentFromSections } from './render';

// Tag constants referenced by every mutation below.
const ADMIN_LIST_TAG = 'pages:admin-list';
const PUBLIC_LIST_TAG = 'pages:list';
const detailTag = (slug: string) => `pages:detail:${slug}`;

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

export async function listPages(
  opts: {
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
    take?: number;
    skip?: number;
  } = {}
) {
  const { status, take = 50, skip = 0 } = opts;
  const key = `pages:admin:${JSON.stringify({ status: status ?? null, take, skip })}`;
  return unstable_cache(
    async () =>
      db.page.findMany({
        where: { ...(status ? { status } : {}) },
        orderBy: { updatedAt: 'desc' },
        take,
        skip,
        select: { id: true, title: true, slug: true, status: true, updatedAt: true }
      }),
    [key],
    { tags: [ADMIN_LIST_TAG], revalidate: 30 }
  )().then((rows) => reviveDates(rows));
}

export { ADMIN_LIST_TAG, PUBLIC_LIST_TAG, detailTag };

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
  sections: SectionsArraySchema
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  sections: SectionsArraySchema.optional(),
  status: StatusEnum.optional()
});

/** Create a new Page (initially DRAFT) + slug uniqueness check. */
export async function createPage(input: { title: string; sections: Section[] }): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const sections = parsed.data.sections;
  const content = deriveContentFromSections(sections);

  const baseSlug = pageSlugFromTitle(parsed.data.title);
  const slug = await ensureUniquePageSlug(baseSlug, (s) => pageSlugExists(s));

  const page = await db.page.create({
    data: {
      title: parsed.data.title,
      slug,
      content,
      sections,
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
  revalidateTag(ADMIN_LIST_TAG);
  revalidateTag(PUBLIC_LIST_TAG);
  return page.id;
}

/** Update Page (partial). On title change, upserts a Redirect row + updates slug. */
export async function updatePage(input: {
  id: string;
  title?: string;
  sections?: Section[];
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
}): Promise<void> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const existing = await db.page.findUnique({ where: { id: parsed.data.id } });
  if (!existing) throw new Error('Page not found');

  const titleChanged = parsed.data.title !== undefined && parsed.data.title !== existing.title;

  // Derive content from sections whenever sections are provided.
  const sections = parsed.data.sections;
  const content = sections !== undefined ? deriveContentFromSections(sections) : undefined;

  await db.page.update({
    where: { id: parsed.data.id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(sections !== undefined ? { sections, content } : {}),
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
  revalidateTag(ADMIN_LIST_TAG);
  revalidateTag(PUBLIC_LIST_TAG);
  // Always bust the public detail cache for the current slug — sections/status
  // edits without a title change still need to invalidate the cached HTML.
  if (existing.slug) revalidateTag(detailTag(existing.slug));
  // On title change, also bust the path for the new slug (path-level ISR).
  if (titleChanged && existing.slug) {
    const nextSlug = pageSlugFromTitle(parsed.data.title!);
    revalidatePath(`/${nextSlug}`);
  }
}

/** Delete a Page (hard delete). */
export async function deletePage(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  const existing = await db.page.findUnique({
    where: { id },
    select: { slug: true }
  });
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
  revalidateTag(ADMIN_LIST_TAG);
  revalidateTag(PUBLIC_LIST_TAG);
  // Bust the public detail cache for the slug (if any) so visitors don't
  // see the deleted page for up to 5 min while the ISR cache lingers.
  if (existing?.slug) {
    revalidateTag(detailTag(existing.slug));
    revalidatePath(`/${existing.slug}`);
  }
}
