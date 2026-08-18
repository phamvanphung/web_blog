'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { deleteMediaAction } from '@/modules/media/server/delete';

export async function deleteMediaFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteMediaAction(id);
  revalidatePath('/admin/media');
  // Media images appear in the category card via `categories:list` cache.
  revalidateTag('categories:list');
}
