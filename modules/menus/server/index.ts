// modules/menus/server/index.ts
// Menus + MenuItems CRUD. Admin-only.
//
// Note: the Prisma `MenuItem` column for the target kind is named `type`
// (enum `MenuItemType`), while the public API exposes it as `targetType`.
// We map between the two at the boundary.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { buildMenuTree, type FlatMenuItem } from './tree';

/* ---------- Read queries ---------- */

export async function listMenus() {
  return db.menu.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, location: true, updatedAt: true }
  });
}

export async function getMenu(id: string) {
  return db.menu.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } }
  });
}

export async function listMenuItems(menuId: string): Promise<FlatMenuItem[]> {
  const rows = await db.menuItem.findMany({
    where: { menuId },
    orderBy: { sortOrder: 'asc' }
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    parentId: r.parentId,
    sortOrder: r.sortOrder,
    targetType: r.type,
    targetId: r.targetId,
    externalUrl: r.externalUrl,
    openInNew: r.openInNew,
    isVisible: r.isVisible
  }));
}

export async function buildMenuTreeFor(menuId: string) {
  const items = await listMenuItems(menuId);
  return buildMenuTree(items);
}

/* ---------- Mutations ---------- */

const CreateMenuSchema = z.object({
  name: z.string().min(1).max(80),
  location: z.string().max(40).nullable().optional()
});
const ItemInput = z.object({
  label: z.string().min(1).max(120),
  parentId: z.string().nullable().optional(),
  targetType: z.enum(['PAGE', 'POST', 'CATEGORY', 'EXTERNAL']),
  targetId: z.string().nullable().optional(),
  externalUrl: z.string().max(500).nullable().optional(),
  openInNew: z.boolean().optional(),
  isVisible: z.boolean().optional()
});

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
}

export async function createMenu(input: {
  name: string;
  location?: string | null;
}): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = CreateMenuSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');
  const menu = await db.menu.create({
    data: { name: parsed.data.name, location: parsed.data.location ?? null }
  });
  await audit({
    userId: me.id,
    action: 'menu.create',
    target: 'Menu',
    targetId: menu.id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/menus');
  return menu.id;
}

export async function deleteMenu(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  await db.menu.delete({ where: { id } });
  await audit({
    userId: me.id,
    action: 'menu.delete',
    target: 'Menu',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/menus');
}

export async function addMenuItem(
  menuId: string,
  input: {
    label: string;
    parentId?: string | null;
    targetType: 'PAGE' | 'POST' | 'CATEGORY' | 'EXTERNAL';
    targetId?: string | null;
    externalUrl?: string | null;
    openInNew?: boolean;
    isVisible?: boolean;
  }
): Promise<string> {
  const me = await requireRole('ADMIN');
  const parsed = ItemInput.safeParse(input);
  if (!parsed.success) throw new Error('Invalid input');

  const maxRow = await db.menuItem.aggregate({
    where: { menuId, parentId: parsed.data.parentId ?? null },
    _max: { sortOrder: true }
  });
  const nextSort = (maxRow._max.sortOrder ?? -1) + 1;

  const item = await db.menuItem.create({
    data: {
      menuId,
      label: parsed.data.label,
      parentId: parsed.data.parentId ?? null,
      type: parsed.data.targetType,
      targetId: parsed.data.targetId ?? null,
      externalUrl: parsed.data.externalUrl ?? null,
      openInNew: parsed.data.openInNew ?? false,
      isVisible: parsed.data.isVisible ?? true,
      sortOrder: nextSort
    }
  });
  await audit({
    userId: me.id,
    action: 'menu.item.add',
    target: 'MenuItem',
    targetId: item.id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath(`/admin/menus/${menuId}/edit`);
  return item.id;
}

export async function updateMenuItem(
  id: string,
  input: Partial<{
    label: string;
    parentId: string | null;
    targetType: 'PAGE' | 'POST' | 'CATEGORY' | 'EXTERNAL';
    targetId: string | null;
    externalUrl: string | null;
    openInNew: boolean;
    isVisible: boolean;
    sortOrder: number;
  }>
): Promise<void> {
  const me = await requireRole('ADMIN');
  // Translate public-API `targetType` to Prisma column `type`.
  const { targetType, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (targetType !== undefined) data.type = targetType;
  await db.menuItem.update({ where: { id }, data: data as never });
  await audit({
    userId: me.id,
    action: 'menu.item.update',
    target: 'MenuItem',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  const item = await db.menuItem.findUnique({ where: { id } });
  if (item) revalidatePath(`/admin/menus/${item.menuId}/edit`);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const me = await requireRole('ADMIN');
  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) return;
  await db.menuItem.delete({ where: { id } });
  await audit({
    userId: me.id,
    action: 'menu.item.delete',
    target: 'MenuItem',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath(`/admin/menus/${item.menuId}/edit`);
}
