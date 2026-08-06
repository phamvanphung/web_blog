'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

const VALID_STATUSES = ['NEW', 'READ', 'ARCHIVED'] as const;
type ContactStatus = (typeof VALID_STATUSES)[number];

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
}

export async function updateContactStatusAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as ContactStatus;
  if (!id || !VALID_STATUSES.includes(status)) return;
  await db.contactSubmission.update({ where: { id }, data: { status } });
  await audit({
    userId: me.id,
    action: 'contact.updateStatus',
    target: 'ContactSubmission',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/contacts');
}

export async function deleteContactAction(formData: FormData): Promise<void> {
  const me = await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await db.contactSubmission.delete({ where: { id } });
  await audit({
    userId: me.id,
    action: 'contact.delete',
    target: 'ContactSubmission',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/contacts');
}
