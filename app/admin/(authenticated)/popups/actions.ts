'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import {
  createPopup,
  updatePopup,
  softDeletePopup
} from '@/modules/popups/server';
import type { CreatePopupInput } from '@/modules/popups/types';

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v : '';
}

function asInt(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number(asString(v));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asLines(v: FormDataEntryValue | null): string[] {
  return asString(v)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type PopupFormState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

async function parseForm(formData: FormData): Promise<CreatePopupInput> {
  const triggerType = asString(formData.get('triggerType')) as
    | 'ALL'
    | 'HOMEPAGE'
    | 'PATH';
  const triggerPathsRaw = asLines(formData.get('triggerPaths'));
  return {
    name: asString(formData.get('name')).trim(),
    htmlContent: asString(formData.get('htmlContent')),
    triggerType,
    triggerPaths: triggerType === 'PATH' ? triggerPathsRaw : null,
    frequency: asString(formData.get('frequency')) as 'ALWAYS' | 'ONCE',
    delaySeconds: asInt(formData.get('delaySeconds'), 0),
    status: asString(formData.get('status')) as 'DRAFT' | 'PUBLISHED',
    notes: (() => {
      const v = asString(formData.get('notes')).trim();
      return v ? v : null;
    })()
  };
}

export async function createPopupAction(
  _prev: PopupFormState,
  formData: FormData
): Promise<PopupFormState> {
  await requireRole('ADMIN');
  try {
    const input = await parseForm(formData);
    await createPopup(input);
    revalidatePath('/admin/popups');
    revalidateTag('popups:public');
    redirect('/admin/popups');
  } catch (e) {
    if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e;
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi không xác định' };
  }
}

export async function updatePopupAction(
  id: string,
  _prev: PopupFormState,
  formData: FormData
): Promise<PopupFormState> {
  await requireRole('ADMIN');
  try {
    const input = await parseForm(formData);
    await updatePopup({ id, ...input });
    revalidatePath('/admin/popups');
    revalidatePath(`/admin/popups/${id}`);
    revalidateTag('popups:public');
    redirect('/admin/popups');
  } catch (e) {
    if (e instanceof Error && e.message.includes('NEXT_REDIRECT')) throw e;
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi không xác định' };
  }
}

export async function deletePopupAction(formData: FormData): Promise<void> {
  await requireRole('ADMIN');
  const id = asString(formData.get('id'));
  await softDeletePopup(id);
  revalidatePath('/admin/popups');
  revalidateTag('popups:public');
}