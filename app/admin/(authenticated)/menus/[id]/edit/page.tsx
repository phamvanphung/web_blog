import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  getMenu,
  buildMenuTreeFor,
  addMenuItem,
  deleteMenuItem,
  updateMenuItem,
  setMenuLocation
} from '@/modules/menus/server';
import { MenuEditor } from '../../MenuEditor';

export const dynamic = 'force-dynamic';

async function setLocationAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  const location = String(formData.get('location') ?? '').trim();
  if (!id) return;
  await setMenuLocation(id, location || null);
  revalidatePath(`/admin/menus/${id}/edit`);
}

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

      <form
        action={setLocationAction}
        className="mb-6 flex max-w-prose items-end gap-3 border-b border-line pb-4"
      >
        <input type="hidden" name="id" value={id} />
        <div className="flex-1">
          <label className="mb-1 block text-sm">
            Location <span className="text-muted">(đặt <code>primary</code> để hiện ở header)</span>
          </label>
          <input
            name="location"
            defaultValue={menu.location ?? ''}
            placeholder="primary / footer / ..."
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="border border-line bg-fg px-4 py-2 text-sm text-bg">
          Lưu location
        </button>
      </form>

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
