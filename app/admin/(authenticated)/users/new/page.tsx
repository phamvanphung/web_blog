import { requireRole } from '@/lib/auth';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { NewUserForm } from '../NewUserForm';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  await requireRole('ADMIN');
  return (
    <div className="max-w-prose">
      <AdminBreadcrumb items={[{ href: '/admin/users', label: 'Users' }, { label: 'Mới' }]} />
      <h1 className="mb-2 text-d-sm">Tạo user</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        User mới sẽ được tạo ở trạng thái <strong>Active</strong>. Đổi trạng thái hoặc reset password sau khi tạo.
      </p>
      <NewUserForm />
    </div>
  );
}