import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { EditUserForm } from '../../EditUserForm';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true
    }
  });
  if (!user) notFound();

  return (
    <div className="max-w-prose">
      <AdminBreadcrumb items={[{ href: '/admin/users', label: 'Users' }, { label: 'Sửa' }]} />
      <h1 className="mb-2 text-d-sm">Sửa user</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Sửa email, tên, role, hoặc trạng thái. Đổi mật khẩu qua nút <strong>Reset pass</strong> ở danh sách Users.
      </p>
      <EditUserForm user={user} />
    </div>
  );
}