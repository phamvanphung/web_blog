import { PageForm } from '../PageForm';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

export default function NewPagePage() {
  return (
    <div>
      <AdminBreadcrumb items={[{ href: '/admin/pages', label: 'Trang' }, { label: 'Mới' }]} />
      <h1 className="mb-2 text-d-sm">Trang mới</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Tạo trang tĩnh (plain text). Slug tự sinh từ tiêu đề.
      </p>
      <PageForm />
    </div>
  );
}
