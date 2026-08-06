import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { updateUserAction } from '../../actions';

export const dynamic = 'force-dynamic';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export default async function EditUserPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole('ADMIN');
  const { id } = await params;
  const sp = await searchParams;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div className="max-w-prose">
      <AdminBreadcrumb items={[{ href: '/admin/users', label: 'Users' }, { label: 'Sửa' }]} />
      <h1 className="mb-2 text-d-sm">Sửa user</h1>
      {sp.error === 'invalid' && (
        <div className="mb-4 rounded-11 border border-hairline bg-canvas-parchment p-3 text-[13px] text-[#d70015]">
          Dữ liệu không hợp lệ.
        </div>
      )}
      <form action={updateUserAction} className="space-y-5">
        <input type="hidden" name="id" value={user.id} />
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tên</label>
          <input name="name" defaultValue={user.name} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mật khẩu mới (để trống nếu giữ)</label>
          <input
            type="password"
            name="password"
            minLength={8}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <select name="role" defaultValue={user.role} className={inputClass}>
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Trạng thái</label>
          <select name="status" defaultValue={user.status} className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
        <Button type="submit" variant="primary-pill">
          Lưu
        </Button>
      </form>
    </div>
  );
}
