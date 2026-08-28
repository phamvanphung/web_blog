import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { requireRole } from '@/lib/auth';
import { PopupForm } from '../_components/PopupForm';

export const dynamic = 'force-dynamic';

export default async function NewPopupPage() {
  await requireRole('ADMIN');
  return (
    <div>
      <AdminBreadcrumb
        items={[
          { href: '/admin/popups', label: 'Popups' },
          { label: 'Mới' }
        ]}
      />
      <h1 className="mb-2 text-d-sm">Popup mới</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Dán code HTML+CSS+JS vào ô bên dưới. Khi đã đăng, popup render trong iframe sandbox trên site.
      </p>
      <PopupForm />
    </div>
  );
}