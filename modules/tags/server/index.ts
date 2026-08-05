import { db } from '@/lib/db';
import { ensureUniqueSlug, slugify } from '@/lib/slug';

export async function listTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' } });
}

export async function createTag(input: { name: string }) {
  const base = slugify(input.name);
  const slug = await ensureUniqueSlug(
    base || 'tag',
    async (s) => !!(await db.tag.findUnique({ where: { slug: s } }))
  );
  return db.tag.create({
    data: { name: input.name.slice(0, 80), slug }
  });
}

export async function deleteTag(id: string): Promise<void> {
  await db.tag.delete({ where: { id } });
}
