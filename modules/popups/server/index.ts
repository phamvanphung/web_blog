// modules/popups/server/index.ts
// Admin CRUD for popups. Mirrors modules/posts/server pattern.

import { unstable_cache, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { reviveDates } from '@/lib/cache/revive';
import { Prisma } from '@prisma/client';
import { PopupCreateSchema, PopupUpdateSchema } from '../schema';
import type { CreatePopupInput, UpdatePopupInput } from '../types';

export const POPUPS_ADMIN_LIST_TAG = 'popups:admin-list';

/** Admin list: paginated, filterable by status. */
export async function listPopups(
  opts: { status?: 'DRAFT' | 'PUBLISHED'; take?: number; skip?: number } = {}
) {
  const { status, take = 50, skip = 0 } = opts;
  const key = `popups:admin:${JSON.stringify({ status: status ?? null, take, skip })}`;
  return unstable_cache(
    async () =>
      db.popup.findMany({
        where: { ...(status ? { status } : {}), deletedAt: null },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        take,
        skip,
        select: {
          id: true,
          name: true,
          triggerType: true,
          triggerPaths: true,
          frequency: true,
          delaySeconds: true,
          status: true,
          updatedAt: true
        }
      }),
    [key],
    { tags: [POPUPS_ADMIN_LIST_TAG], revalidate: 30 }
  )().then((rows) => reviveDates(rows));
}

export async function getPopup(idOrName: string) {
  const byId = await db.popup.findUnique({ where: { id: idOrName } });
  if (byId) return byId;
  return db.popup.findFirst({
    where: { name: idOrName, deletedAt: null }
  });
}

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
}

export async function createPopup(input: CreatePopupInput): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = PopupCreateSchema.parse(input);

  const popup = await db.popup.create({
    data: {
      name: parsed.name,
      htmlContent: parsed.htmlContent,
      triggerType: parsed.triggerType,
      ...(parsed.triggerPaths === null ? {} : { triggerPaths: parsed.triggerPaths }),
      frequency: parsed.frequency,
      delaySeconds: parsed.delaySeconds,
      status: parsed.status,
      notes: parsed.notes
    }
  });

  await audit({
    userId: me.id,
    action: 'popup.create',
    target: 'Popup',
    targetId: popup.id,
    ipHash: await hashIp(await getClientIp())
  });

  revalidateTag(POPUPS_ADMIN_LIST_TAG);
  revalidateTag('popups:public');
  return popup.id;
}

export async function updatePopup(input: UpdatePopupInput & { id: string }): Promise<void> {
  const me = await requireRole('ADMIN');
  const parsed = PopupUpdateSchema.parse(input);
  const existing = await db.popup.findUnique({ where: { id: parsed.id } });
  if (!existing) throw new Error('Popup not found');

  await db.popup.update({
    where: { id: parsed.id },
    data: {
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.htmlContent !== undefined ? { htmlContent: parsed.htmlContent } : {}),
      ...(parsed.triggerType !== undefined ? { triggerType: parsed.triggerType } : {}),
      ...(parsed.triggerPaths !== undefined
        ? { triggerPaths: parsed.triggerPaths === null ? Prisma.JsonNull : parsed.triggerPaths }
        : {}),
      ...(parsed.frequency !== undefined ? { frequency: parsed.frequency } : {}),
      ...(parsed.delaySeconds !== undefined ? { delaySeconds: parsed.delaySeconds } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.notes !== undefined ? { notes: parsed.notes } : {})
    }
  });

  await audit({
    userId: me.id,
    action: 'popup.update',
    target: 'Popup',
    targetId: parsed.id,
    ipHash: await hashIp(await getClientIp())
  });

  revalidateTag(POPUPS_ADMIN_LIST_TAG);
  revalidateTag('popups:public');
}

export async function softDeletePopup(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  const existing = await db.popup.findUnique({ where: { id } });
  if (!existing) throw new Error('Popup not found');

  await db.popup.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await audit({
    userId: me.id,
    action: 'popup.delete',
    target: 'Popup',
    targetId: id,
    ipHash: await hashIp(await getClientIp())
  });

  revalidateTag(POPUPS_ADMIN_LIST_TAG);
  revalidateTag('popups:public');
}
