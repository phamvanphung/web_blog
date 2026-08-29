'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { deleteOldAuditEntries } from '@/modules/audit/server/list';

export async function purgeOldAction(): Promise<void> {
  await requireRole('ADMIN');
  try {
    await deleteOldAuditEntries(90);
  } finally {
    revalidatePath('/admin/audit-log');
  }
}
