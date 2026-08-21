'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { createPage, updatePage, deletePage } from '@/modules/pages/server';
import { SectionsArraySchema } from '@/modules/pages/schema';

const CreateSchema = z.object({
  title: z.string().min(1).max(255),
  sections: SectionsArraySchema
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  sections: SectionsArraySchema.optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional()
});

export type PageFormState = { ok: true; id: string } | { ok: false; error: string };

export async function createPageAction(
  _prev: PageFormState | undefined,
  formData: FormData
): Promise<PageFormState> {
  const me = await requireRole('ADMIN');
  const title = String(formData.get('title') ?? '');
  const sectionsRaw = String(formData.get('sections') ?? '[]');

  let sections;
  try {
    sections = JSON.parse(sectionsRaw);
  } catch {
    return { ok: false, error: 'Sections JSON không hợp lệ.' };
  }

  const parsed = CreateSchema.safeParse({ title, sections });
  if (!parsed.success) return { ok: false, error: 'Tiêu đề + sections không hợp lệ.' };

  const id = await createPage({ title: parsed.data.title, sections: parsed.data.sections });
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
  // Redirect to the edit page so the URL actually changes. This makes
  // the browser's Back button return to /admin/pages (the list) instead
  // of re-showing the now-empty "new" form — important when the page
  // lives inside an iframe wrapper whose own back stack otherwise
  // disagrees with the iframe's history.
  redirect(`/admin/pages/${id}/edit`);
}

export async function updatePageAction(
  _prev: PageFormState | undefined,
  formData: FormData
): Promise<PageFormState> {
  const me = await requireRole('ADMIN');

  let sections;
  const sectionsRaw = String(formData.get('sections') ?? 'null');
  if (sectionsRaw !== 'null') {
    try {
      sections = JSON.parse(sectionsRaw);
    } catch {
      return { ok: false, error: 'Sections JSON không hợp lệ.' };
    }
  }

  const parsed = UpdateSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    title: formData.get('title') ? String(formData.get('title')) : undefined,
    sections,
    status: formData.get('status')
      ? (formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'HIDDEN')
      : undefined
  });
  if (!parsed.success) return { ok: false, error: 'Dữ liệu không hợp lệ.' };

  const { id, title, status } = parsed.data;
  await updatePage({ id, title, sections: parsed.data.sections, status });
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  await audit({
    userId: me.id,
    action: 'page.update',
    target: 'Page',
    targetId: id,
    ipHash: await hashIp(ip)
  });
  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${id}/edit`);
  return { ok: true, id };
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
