import { db } from '@/lib/db';
import { ensureUniqueSlug, slugify } from '@/lib/slug';

export async function listCategories() {
  return db.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { group: true }
  });
}

export async function listCategoryGroupsForAdmin() {
  return db.categoryGroup.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function getCategory(id: string) {
  return db.category.findUnique({ where: { id } });
}

export async function createCategory(input: {
  name: string;
  parentId?: string | null;
  description?: string | null;
  groupId?: string | null;
  hidden?: boolean;
}) {
  const base = slugify(input.name);
  const slug = await ensureUniqueSlug(
    base || 'category',
    async (s) => !!(await db.category.findUnique({ where: { slug: s } }))
  );
  return db.category.create({
    data: {
      name: input.name.slice(0, 120),
      slug,
      parentId: input.parentId ?? null,
      description: input.description?.slice(0, 1000) ?? null,
      groupId: input.groupId ?? null,
      hidden: input.hidden ?? false
    }
  });
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    parentId?: string | null;
    description?: string | null;
    groupId?: string | null;
    hidden?: boolean;
  }
) {
  return db.category.update({
    where: { id },
    data: {
      ...(input.name != null ? { name: input.name.slice(0, 120) } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.slice(0, 1000) ?? null }
        : {}),
      ...(input.groupId !== undefined ? { groupId: input.groupId } : {}),
      ...(input.hidden !== undefined ? { hidden: input.hidden } : {})
    }
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await db.category.delete({ where: { id } });
}
