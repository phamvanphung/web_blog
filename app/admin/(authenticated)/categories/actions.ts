'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createCategory, updateCategory, deleteCategory } from '@/modules/categories/server';

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  parentId: z.string().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  groupId: z.string().nullable().optional(),
  hidden: z.boolean().optional()
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  parentId: z.string().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  groupId: z.string().nullable().optional(),
  hidden: z.boolean().optional()
});

export type CategoryFormState = { ok: true } | { ok: false; error: string };

export async function createCategoryAction(
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    parentId: (formData.get('parentId') as string | null) || null,
    description: (formData.get('description') as string | null) || null,
    groupId: (formData.get('groupId') as string | null) || null,
    hidden: (formData.getAll('hidden').at(-1) ?? 'false') === 'true'
  });
  if (!parsed.success) return { ok: false, error: 'Tên + mô tả (nếu có) không hợp lệ.' };

  const cat = await createCategory(parsed.data);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category.create',
    target: 'Category',
    targetId: cat.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/categories');
  revalidateTag('categories:list');
  return { ok: true };
}

export async function updateCategoryAction(
  _prev: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    name: formData.get('name') ? String(formData.get('name')) : undefined,
    parentId: formData.has('parentId')
      ? (formData.get('parentId') as string | null) || null
      : undefined,
    description: formData.has('description')
      ? (formData.get('description') as string | null) || null
      : undefined,
    groupId: formData.has('groupId')
      ? (formData.get('groupId') as string | null) || null
      : undefined,
    hidden: (formData.getAll('hidden').at(-1) ?? 'false') === 'true'
  });
  if (!parsed.success) return { ok: false, error: 'Dữ liệu không hợp lệ.' };

  await updateCategory(parsed.data.id, {
    name: parsed.data.name,
    parentId: parsed.data.parentId,
    description: parsed.data.description,
    groupId: parsed.data.groupId,
    hidden: parsed.data.hidden
  });
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category.update',
    target: 'Category',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/categories');
  revalidateTag('categories:list');
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteCategory(id);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category.delete',
    target: 'Category',
    targetId: id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/categories');
  revalidateTag('categories:list');
}
