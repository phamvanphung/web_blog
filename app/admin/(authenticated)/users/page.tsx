// P1: landing only. Full user management comes after P2 (once we know what
// else admin needs to manage). For now: list + role badge.

import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await requireRole('ADMIN');
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div>
      <h1 className="mb-2 text-3xl">Users</h1>
      <p className="mb-8 text-sm text-muted">
        Admin-only. Tạo / sửa user sẽ thêm ở phase sau (sau P2 media).
      </p>

      <table className="w-full max-w-prose text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
            <th className="py-2">Email</th>
            <th className="py-2">Tên</th>
            <th className="py-2">Role</th>
            <th className="py-2">Trạng thái</th>
            <th className="py-2">Lần cuối login</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line">
              <td className="py-2 font-ui">{u.email}</td>
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.role.toLowerCase()}</td>
              <td className="py-2">{u.status.toLowerCase()}</td>
              <td className="py-2 text-muted">
                {u.lastLoginAt ? u.lastLoginAt.toISOString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
