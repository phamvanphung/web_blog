'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createGroup, updateGroup, deleteGroup } from '@/modules/category-groups/server';
import { CreateGroupSchema, UpdateGroupSchema } from '@/modules/category-groups/server/schema';

const DeleteSchema = z.object({ id: z.string().min(1) });

export type GroupFormState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

export async function createGroupAction(
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const me = await requireRole('ADMIN');
  const parsed = CreateGroupSchema.safeParse({
    name: String(formData.get('name') ?? '')
  });
  if (!parsed.success) return { ok: false, error: 'Tên group không hợp lệ.' };
  const g = await createGroup(parsed.data);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category-group.create',
    target: 'CategoryGroup',
    targetId: g.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/category-groups');
  return { ok: true };
}

export async function updateGroupAction(
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateGroupSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    name: formData.has('name') ? String(formData.get('name') ?? '') : undefined,
    sortOrder: formData.has('sortOrder')
      ? Number(formData.get('sortOrder') ?? 0) || 0
      : undefined
  });
  if (!parsed.success) return { ok: false, error: 'Dữ liệu không hợp lệ.' };
  await updateGroup(parsed.data.id, {
    name: parsed.data.name,
    sortOrder: parsed.data.sortOrder
  });
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category-group.update',
    target: 'CategoryGroup',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/category-groups');
  return { ok: true };
}

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const parsed = DeleteSchema.safeParse({ id: String(formData.get('id') ?? '') });
  if (!parsed.success) return;
  try {
    await deleteGroup(parsed.data.id);
  } catch {
    // Swallow errors; the row's delete button is gated by `isProtected` /
    // `refCount === 0` on the server, so a delete here should rarely fail.
    // Admin can see the next list render still has the row.
    return;
  }
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'category-group.delete',
    target: 'CategoryGroup',
    targetId: parsed.data.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/category-groups');
}
