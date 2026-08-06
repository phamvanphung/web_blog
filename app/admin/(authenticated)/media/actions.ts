'use server';

import { revalidatePath } from 'next/cache';
import { deleteMediaAction } from '@/modules/media/server/delete';

export async function deleteMediaFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteMediaAction(id);
  revalidatePath('/admin/media');
}
