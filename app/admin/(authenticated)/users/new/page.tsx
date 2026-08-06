import { requireRole } from '@/lib/auth';
import { createUserAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  await requireRole('ADMIN');
  return (
    <div className="max-w-prose">
      <h1 className="mb-2 text-3xl">Tạo user</h1>
      <form action={createUserAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email *</label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Tên *</label>
          <input
            name="name"
            required
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Mật khẩu (≥ 8 ký tự) *</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Role *</label>
          <select
            name="role"
            defaultValue="EDITOR"
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <button type="submit" className="border border-line bg-fg px-5 py-2 text-sm text-bg">
          Tạo
        </button>
      </form>
    </div>
  );
}
