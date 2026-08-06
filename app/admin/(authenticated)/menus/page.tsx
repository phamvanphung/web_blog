import { requireRole } from '@/lib/auth';
import { listMenus, createMenu, deleteMenu } from '@/modules/menus/server';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
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

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export default async function MenusPage() {
  await requireRole('ADMIN');
  const menus = await listMenus();
  const primaryMenu = menus.find((m) => m.location === 'primary');

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Menus</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Mỗi menu có nhiều item xếp theo sortOrder.
      </p>

      <div className="mb-8 max-w-prose rounded-18 border border-hairline bg-canvas-parchment p-5 text-[13px]">
        <p className="mb-2 text-ink">
          <strong>
            Menu có <code>location = &apos;primary&apos;</code> sẽ hiển thị ở header trang
            public.
          </strong>
        </p>
        {primaryMenu ? (
          <p className="text-ink-80">
            Hiện tại <strong>{primaryMenu.name}</strong> đang được gắn location{' '}
            <code className="text-ink">primary</code>.
          </p>
        ) : (
          <p className="text-ink-80">
            Chưa có menu nào gắn location <code className="text-ink">primary</code>. Tạo menu
            mới → Sửa items → set location = primary để hiển thị ở header.
          </p>
        )}
      </div>

      <form
        action={createMenuAction}
        className="mb-10 flex max-w-prose items-end gap-3 border-b border-hairline pb-6"
      >
        <div className="flex-1">
          <label className={labelClass}>Tạo menu mới</label>
          <input
            name="name"
            required
            placeholder="header / footer / sidebar…"
            className={inputClass}
          />
        </div>
        <Button type="submit" variant="primary-pill" size="sm">
          + Tạo menu
        </Button>
      </form>

      {menus.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có menu nào.</p>
      ) : (
        <ul className="max-w-prose space-y-2">
          {menus.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-11 border border-hairline p-3"
            >
              <div>
                <p className="text-ink">{m.name}</p>
                <p className="text-[12px] text-ink-48">
                  {m.location ?? '—'} · cập nhật {m.updatedAt.toISOString()}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/menus/${m.id}/edit`}
                  className="text-[12px] text-primary hover:underline"
                >
                  Sửa items
                </Link>
                <form action={deleteMenuAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-[12px] text-[#d70015] hover:underline">
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
