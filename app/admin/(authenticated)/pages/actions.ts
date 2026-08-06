'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createPage, updatePage, deletePage } from '@/modules/pages/server';

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(50_000)
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(50_000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional()
});

export type PageFormState = { ok: true; id: string } | { ok: false; error: string };

export async function createPageAction(
  _prev: PageFormState | undefined,
  formData: FormData
): Promise<PageFormState> {
  const me = await requireRole('ADMIN');
  const parsed = CreateSchema.safeParse({
    title: String(formData.get('title') ?? ''),
    content: String(formData.get('content') ?? '')
  });
  if (!parsed.success) return { ok: false, error: 'Tiêu đề + nội dung không hợp lệ.' };

  const id = await createPage(parsed.data);
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'page.create',
    target: 'Page',
    targetId: id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/pages');
  return { ok: true, id };
}

export async function updatePageAction(
  _prev: PageFormState | undefined,
  formData: FormData
): Promise<PageFormState> {
  const me = await requireRole('ADMIN');
  const parsed = UpdateSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    title: formData.get('title') ? String(formData.get('title')) : undefined,
    content: formData.get('content') ? String(formData.get('content')) : undefined,
    status: formData.get('status')
      ? (formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'HIDDEN')
      : undefined
  });
  if (!parsed.success) return { ok: false, error: 'Dữ liệu không hợp lệ.' };

  await updatePage(parsed.data);
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
  return { ok: true, id: parsed.data.id };
}

export async function deletePageAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deletePage(id);
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
  redirect('/admin/pages');
}
