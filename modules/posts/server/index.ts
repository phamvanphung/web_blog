// modules/posts/server/index.ts
// Posts module: queries, slug helpers. CRUD added in Task 3.5.

import { db } from '@/lib/db';
import { slugify } from '@/lib/slug';

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

export async function listPosts(opts: {
  status?: 'DRAFT' | 'PENDING' | 'SCHEDULED' | 'PUBLISHED' | 'HIDDEN' | 'TRASHED';
  take?: number;
  skip?: number;
} = {}) {
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
