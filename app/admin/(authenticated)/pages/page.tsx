import { requireRole } from '@/lib/auth';
import { listPages } from '@/modules/pages/server';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/ButtonLink';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã xuất bản',
  HIDDEN: 'Đã ẩn'
};

export default async function PagesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const validStatuses = ['DRAFT', 'PUBLISHED', 'HIDDEN'] as const;
  type PageStatus = (typeof validStatuses)[number];
  const status: PageStatus | undefined =
    sp.status && (validStatuses as readonly string[]).includes(sp.status)
      ? (sp.status as PageStatus)
      : undefined;
  const pages = await listPages({ ...(status ? { status } : {}), take: 100 });

  const filterClass = (active: boolean) =>
    `rounded-pill px-3 py-1 text-[12px] transition-colors ${
      active ? 'bg-ink text-white' : 'bg-canvas-parchment text-ink hover:bg-chip'
    }`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-d-sm">Trang</h1>
        <ButtonLink href="/admin/pages/new" variant="primary-pill" size="sm">
          + Trang mới
        </ButtonLink>
      </div>
      <p className="mb-6 text-[13px] text-ink-48">
        Admin-only. Trang tĩnh (plain text, không có Tiptap).
      </p>

      <nav className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/pages" className={filterClass(!status)}>
          Tất cả
        </Link>
        <Link
          href="/admin/pages?status=PUBLISHED"
          className={filterClass(status === 'PUBLISHED')}
        >
          Đã xuất bản
        </Link>
        <Link
          href="/admin/pages?status=DRAFT"
          className={filterClass(status === 'DRAFT')}
        >
          Nháp
        </Link>
      </nav>

      {pages.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có trang nào.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.08em] text-ink-48">
              <th className="py-3">Tiêu đề</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Cập nhật</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-hairline hover:bg-canvas-parchment">
                <td className="py-3 text-ink">{p.title}</td>
                <td className="py-3 text-ink-80">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="py-3 text-[12px] text-ink-48">{p.updatedAt.toISOString()}</td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/pages/${p.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Sửa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
