import { requireRole } from '@/lib/auth';
import { listMenus, createMenu, deleteMenu } from '@/modules/menus/server';
import { Button } from '@/components/ui/Button';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function deleteMenuAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteMenu(id);
  revalidatePath('/admin/menus');
}

async function createMenuAction(formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await createMenu({ name });
  revalidatePath('/admin/menus');
}

export default async function MenusPage() {
  await requireRole('ADMIN');
  const menus = await listMenus();

  return (
    <div>
      <h1 className="mb-2 text-3xl">Menus</h1>
      <p className="mb-8 text-sm text-muted">Admin-only. Mỗi menu có nhiều item xếp theo sortOrder.</p>

      <form
        action={createMenuAction}
        className="mb-8 flex max-w-prose items-end gap-3 border-b border-line pb-6"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm">Tạo menu mới</label>
          <input
            name="name"
            required
            placeholder="header / footer / sidebar…"
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" size="sm">
          + Tạo menu
        </Button>
      </form>

      {menus.length === 0 ? (
        <p className="text-sm text-muted">Chưa có menu nào.</p>
      ) : (
        <ul className="max-w-prose space-y-2">
          {menus.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between border border-line p-3"
            >
              <div>
                <p className="font-ui">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.location ?? '—'} · cập nhật {m.updatedAt.toISOString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/menus/${m.id}/edit`}
                  className="text-xs underline hover:no-underline"
                >
                  Sửa items
                </Link>
                <form action={deleteMenuAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="text-xs text-muted underline hover:no-underline"
                  >
                    Xóa menu
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
