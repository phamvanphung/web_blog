import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteUserAction } from './actions';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const errorMsg =
    sp.error === 'duplicate'
      ? 'Email đã tồn tại.'
      : sp.error === 'invalid'
        ? 'Dữ liệu không hợp lệ.'
        : sp.error === 'self'
          ? 'Không thể xóa chính mình.'
          : null;

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mb-2 text-3xl">Users</h1>
        <Link href="/admin/users/new">
          <Button size="sm">+ Tạo user</Button>
        </Link>
      </div>
      <p className="mb-8 text-sm text-muted">Admin-only. CRUD đầy đủ.</p>

      {errorMsg && (
        <p className="mb-4 border border-line bg-bg p-3 text-sm text-red-700">{errorMsg}</p>
      )}

      <table className="w-full max-w-prose text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <th className="py-2">Email</th>
            <th className="py-2">Tên</th>
            <th className="py-2">Role</th>
            <th className="py-2">Trạng thái</th>
            <th className="py-2">Tạo</th>
            <th className="py-2 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line">
              <td className="py-2 font-ui">{u.email}</td>
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.role.toLowerCase()}</td>
              <td className="py-2">{u.status.toLowerCase()}</td>
              <td className="py-2 text-xs text-muted">{u.createdAt.toISOString()}</td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/users/${u.id}/edit`}
                    className="text-xs underline hover:no-underline"
                  >
                    Sửa
                  </Link>
                  <form action={deleteUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-700 underline hover:no-underline"
                    >
                      Xóa
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
