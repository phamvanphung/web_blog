import { db } from '@/lib/db';
import { ensureUniqueSlug, slugify } from '@/lib/slug';
import type { CategoryGroup } from '../types';

export async function listGroups(): Promise<CategoryGroup[]> {
  return db.categoryGroup.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function getGroup(idOrSlug: string): Promise<CategoryGroup | null> {
  const byId = await db.categoryGroup.findUnique({ where: { id: idOrSlug } });
  if (byId) return byId;
  return db.categoryGroup.findUnique({ where: { slug: idOrSlug } });
}

export async function createGroup(input: { name: string }): Promise<CategoryGroup> {
  const base = slugify(input.name);
  const slug = await ensureUniqueSlug(
    base || 'group',
    async (s) => !!(await db.categoryGroup.findUnique({ where: { slug: s } }))
  );
  return db.categoryGroup.create({
    data: { name: input.name.slice(0, 120), slug }
  });
}

/**
 * Update group fields. Slug is intentionally NOT updatable via the admin —
 * renaming a group preserves its slug once any category references it.
 */
export async function updateGroup(
  id: string,
  input: { name?: string; sortOrder?: number }
): Promise<CategoryGroup> {
  return db.categoryGroup.update({
    where: { id },
    data: {
      ...(input.name != null ? { name: input.name.slice(0, 120) } : {}),
      ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {})
    }
  });
}

export async function deleteGroup(id: string): Promise<void> {
  // Caller MUST check `isProtected` and "no categories reference this group"
  // BEFORE invoking. We add a final guard here so a buggy caller can't
  // delete the seed group.
  const g = await db.categoryGroup.findUnique({ where: { id } });
  if (!g) return;
  if (g.isProtected) {
    throw new Error('Cannot delete the default (protected) group.');
  }
  const refCount = await db.category.count({ where: { groupId: id } });
  if (refCount > 0) {
    throw new Error(`Cannot delete group: ${refCount} category(ies) still reference it.`);
  }
  await db.categoryGroup.delete({ where: { id } });
}

export async function countGroupCategories(groupId: string): Promise<number> {
  return db.category.count({ where: { groupId } });
}
