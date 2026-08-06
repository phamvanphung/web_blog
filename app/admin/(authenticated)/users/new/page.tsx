import { requireRole } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { createUserAction } from '../actions';

export const dynamic = 'force-dynamic';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export default async function NewUserPage() {
  await requireRole('ADMIN');
  return (
    <div className="max-w-prose">
      <AdminBreadcrumb items={[{ href: '/admin/users', label: 'Users' }, { label: 'Mới' }]} />
      <h1 className="mb-2 text-d-sm">Tạo user</h1>
      <form action={createUserAction} className="space-y-5">
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" name="email" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tên *</label>
          <input name="name" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Mật khẩu (≥ 8 ký tự) *</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Role *</label>
          <select
            name="role"
            defaultValue="EDITOR"
            className={inputClass}
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <Button type="submit" variant="primary-pill">
          Tạo
        </Button>
      </form>
    </div>
  );
}
