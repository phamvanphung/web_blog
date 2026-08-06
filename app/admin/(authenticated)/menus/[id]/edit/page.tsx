import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  getMenu,
  buildMenuTreeFor,
  addMenuItem,
  deleteMenuItem,
  updateMenuItem
} from '@/modules/menus/server';
import { MenuEditor } from '../../../MenuEditor';

export const dynamic = 'force-dynamic';

async function addItemAction(formData: FormData) {
  'use server';
  const menuId = String(formData.get('menuId') ?? '');
  const label = String(formData.get('label') ?? '').trim();
  const targetType = String(formData.get('targetType') ?? 'EXTERNAL') as
    | 'PAGE'
    | 'POST'
    | 'CATEGORY'
    | 'EXTERNAL';
  const targetId = (formData.get('targetId') as string | null) || null;
  const externalUrl = (formData.get('externalUrl') as string | null) || null;
  const parentId = (formData.get('parentId') as string | null) || null;
  if (!menuId || !label) return;
  await addMenuItem(menuId, { label, targetType, targetId, externalUrl, parentId });
  revalidatePath(`/admin/menus/${menuId}/edit`);
}

async function deleteItemAction(formData: FormData) {
  'use server';
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return;
  const item = await db.menuItem.findUnique({ where: { id: itemId } });
  await deleteMenuItem(itemId);
  if (item) revalidatePath(`/admin/menus/${item.menuId}/edit`);
}

async function toggleVisibleAction(formData: FormData) {
  'use server';
  const itemId = String(formData.get('itemId') ?? '');
  const visible = formData.get('visible') === 'on';
  if (!itemId) return;
  await updateMenuItem(itemId, { isVisible: visible });
  const item = await db.menuItem.findUnique({ where: { id: itemId } });
  if (item) revalidatePath(`/admin/menus/${item.menuId}/edit`);
}

export default async function MenuEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const { id } = await params;
  const menu = await getMenu(id);
  if (!menu) notFound();

  const tree = await buildMenuTreeFor(id);
  const serialisableTree = JSON.parse(JSON.stringify(tree));

  return (
    <div>
      <h1 className="mb-2 text-3xl">Menu: {menu.name}</h1>
      <p className="mb-6 text-sm text-muted">
        Admin-only. Items đa cấp; sortOrder tăng dần → render thứ tự.
      </p>

      <MenuEditor
        menuId={id}
        items={serialisableTree}
        addAction={addItemAction}
        deleteAction={deleteItemAction}
        toggleVisibleAction={toggleVisibleAction}
      />
    </div>
  );
}
