'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createTag, deleteTag } from '@/modules/tags/server';

const CreateSchema = z.object({ name: z.string().min(1).max(80) });

export type TagFormState = { ok: true } | { ok: false; error: string };

export async function createTagAction(
  _prev: TagFormState | undefined,
  formData: FormData
): Promise<TagFormState> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse({ name: String(formData.get('name') ?? '') });
  if (!parsed.success) return { ok: false, error: 'Tên tag không hợp lệ.' };

  const tag = await createTag(parsed.data);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'tag.create',
    target: 'Tag',
    targetId: tag.id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/tags');
  return { ok: true };
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteTag(id);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'tag.delete',
    target: 'Tag',
    targetId: id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/tags');
}
