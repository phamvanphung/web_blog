import { notFound } from 'next/navigation';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { requireRole } from '@/lib/auth';
import { getPopup } from '@/modules/popups/server';
import { PopupForm } from '../_components/PopupForm';

export const dynamic = 'force-dynamic';

export default async function EditPopupPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole('ADMIN');
  const { id } = await params;
  const popup = await getPopup(id);
  if (!popup) notFound();

  return (
    <div>
      <AdminBreadcrumb
        items={[
          { href: '/admin/popups', label: 'Popups' },
          { label: popup.name }
        ]}
      />
      <h1 className="mb-2 text-d-sm">Sửa popup</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Sửa nội dung, trigger hoặc trạng thái. Lưu sẽ revalidate cache public + admin list.
      </p>
      <PopupForm
        initial={{
          id: popup.id,
          name: popup.name,
          htmlContent: popup.htmlContent,
          triggerType: popup.triggerType,
          triggerPaths: Array.isArray(popup.triggerPaths)
            ? (popup.triggerPaths as string[])
            : [],
          frequency: popup.frequency,
          delaySeconds: popup.delaySeconds,
          status: popup.status,
          notes: popup.notes
        }}
      />
    </div>
  );
}