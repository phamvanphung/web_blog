import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateUserAction } from '../../actions';

export const dynamic = 'force-dynamic';

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
      <h1 className="mb-2 text-3xl">Sửa user</h1>
      {sp.error === 'invalid' && (
        <p className="mb-4 border border-line bg-bg p-3 text-sm text-red-700">
          Dữ liệu không hợp lệ.
        </p>
      )}
      <form action={updateUserAction} className="space-y-4">
        <input type="hidden" name="id" value={user.id} />
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Tên</label>
          <input
            name="name"
            defaultValue={user.name}
            required
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Mật khẩu mới (để trống nếu giữ)</label>
          <input
            type="password"
            name="password"
            minLength={8}
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Role</label>
          <select
            name="role"
            defaultValue={user.role}
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm">Trạng thái</label>
          <select
            name="status"
            defaultValue={user.status}
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
        <button type="submit" className="border border-line bg-fg px-5 py-2 text-sm text-bg">
          Lưu
        </button>
      </form>
    </div>
  );
}
