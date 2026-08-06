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
import { Button } from '@/components/ui/Button';
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

  const inputClass =
    'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
  const labelClass = 'mb-1 block text-[13px] text-ink-80';

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Menu: {menu.name}</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Admin-only. Items đa cấp; sortOrder tăng dần → render thứ tự.
      </p>

      <form
        action={setLocationAction}
        className="mb-8 flex max-w-prose items-end gap-3 border-b border-hairline pb-5"
      >
        <input type="hidden" name="id" value={id} />
        <div className="flex-1">
          <label className={labelClass}>
            Location{' '}
            <span className="text-ink-48">
              (đặt <code>primary</code> để hiện ở header)
            </span>
          </label>
          <input
            name="location"
            defaultValue={menu.location ?? ''}
            placeholder="primary / footer / ..."
            className={inputClass}
          />
        </div>
        <Button type="submit" variant="primary-pill" size="sm">
          Lưu location
        </Button>
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
