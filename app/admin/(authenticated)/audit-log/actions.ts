'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { deleteOldAuditEntries } from '@/modules/audit/server/list';
import { logger } from '@/lib/logger';

export async function purgeOldAction(): Promise<void> {
  await requireRole('ADMIN');
  try {
    const n = await deleteOldAuditEntries(90);
    logger.info('audit.purge', { removed: n });
  } finally {
    revalidatePath('/admin/audit-log');
  }
}
