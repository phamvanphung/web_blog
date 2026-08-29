import Link from 'next/link';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { requireRole } from '@/lib/auth';
import { listPopups } from '@/modules/popups/server';
import { deletePopupAction } from './actions';

export const dynamic = 'force-dynamic';

const TRIGGER_LABELS: Record<string, string> = {
  ALL: 'Mọi trang',
  HOMEPAGE: 'Trang chủ',
  PATH: 'Theo path'
};

const FREQ_LABELS: Record<string, string> = {
  ALWAYS: 'Luôn',
  ONCE: '1 lần'
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản'
};

export default async function PopupsPage() {
  await requireRole('ADMIN');
  const popups = await listPopups({ take: 50 });

  return (
    <div>
      <AdminBreadcrumb items={[{ href: '/admin/popups', label: 'Popups' }]} />
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-d-sm">Popups</h1>
        <ButtonLink href="/admin/popups/new" variant="primary-pill" size="sm">
          + Tạo popup mới
        </ButtonLink>
      </div>
      <p className="mb-6 text-[13px] text-ink-48">
        Admin-only. Mỗi popup render trong iframe với sandbox; đóng bằng nút X hoặc phím ESC.
      </p>

      {popups.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có popup.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.08em] text-ink-48">
              <th className="py-3">Tên</th>
              <th className="py-3">Trigger</th>
              <th className="py-3">Tần suất</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Cập nhật</th>
              <th className="py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {popups.map((p) => (
              <tr key={p.id} className="border-b border-hairline hover:bg-canvas-parchment">
                <td className="py-3 text-ink">{p.name}</td>
                <td className="py-3 text-ink-80">
                  {TRIGGER_LABELS[p.triggerType] ?? p.triggerType}
                  {p.triggerType === 'PATH' && Array.isArray(p.triggerPaths) && (
                    <span className="ml-1 text-ink-48">
                      ({p.triggerPaths.length})
                    </span>
                  )}
                </td>
                <td className="py-3 text-ink-80">{FREQ_LABELS[p.frequency] ?? p.frequency}</td>
                <td className="py-3 text-ink-80">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="py-3 text-[12px] text-ink-48">{p.updatedAt.toISOString()}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/popups/${p.id}`}
                      className="text-primary hover:underline"
                    >
                      Sửa
                    </Link>
                    <form action={deletePopupAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-error hover:underline"
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
      )}
    </div>
  );
}