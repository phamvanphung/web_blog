import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteUserAction } from './actions';
import { ButtonLink } from '@/components/ui/ButtonLink';
import Link from 'next/link';
import { UserRowActions } from './UserRowActions';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireRole('ADMIN');
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
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-d-sm">Users</h1>
        <ButtonLink href="/admin/users/new" variant="primary-pill" size="sm">
          + Tạo user
        </ButtonLink>
      </div>
      <p className="mb-8 text-[13px] text-ink-48">Admin-only. CRUD đầy đủ.</p>

      {errorMsg && (
        <div className="mb-4 rounded-11 border border-hairline bg-canvas-parchment p-3 text-[13px] text-[#d70015]">
          {errorMsg}
        </div>
      )}

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.08em] text-ink-48">
            <th className="py-3">Email</th>
            <th className="py-3">Tên</th>
            <th className="py-3">Role</th>
            <th className="py-3">Trạng thái</th>
            <th className="py-3">Tạo</th>
            <th className="py-3 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-hairline hover:bg-canvas-parchment">
              <td className="py-3 text-ink">{u.email}</td>
              <td className="py-3 text-ink-80">{u.name}</td>
              <td className="py-3 text-ink-80">{u.role.toLowerCase()}</td>
              <td className="py-3 text-ink-80">
                <span
                  className={
                    u.status === 'ACTIVE'
                      ? 'inline-block rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] text-primary'
                      : 'inline-block rounded-pill bg-canvas-parchment px-2 py-0.5 text-[11px] uppercase tracking-[0.06em] text-ink-48'
                  }
                >
                  {u.status.toLowerCase()}
                </span>
              </td>
              <td className="py-3 text-[12px] text-ink-48">{u.createdAt.toISOString()}</td>
              <td className="py-3 text-right">
                <div className="flex flex-col items-end gap-2">
                  <UserRowActions
                    userId={u.id}
                    status={u.status as 'ACTIVE' | 'DISABLED'}
                    isSelf={u.id === me.id}
                  />
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/users/${u.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Sửa
                    </Link>
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        className="text-[#d70015] hover:underline"
                        title={
                          u.id === me.id
                            ? 'Không thể xóa chính mình'
                            : 'Xoá user này'
                        }
                      >
                        Xóa
                      </button>
                    </form>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
