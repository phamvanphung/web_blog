import { requireRole } from '@/lib/auth';
import { listPages } from '@/modules/pages/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mb-2 text-3xl">Trang</h1>
        <Link href="/admin/pages/new">
          <Button size="sm">+ Trang mới</Button>
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Admin-only. Trang tĩnh (plain text, không có Tiptap).
      </p>

      <nav className="mb-6 flex gap-2 text-xs">
        <Link
          href="/admin/pages"
          className={`border border-line px-2 py-1 ${!status ? 'bg-line' : ''}`}
        >
          Tất cả
        </Link>
        <Link
          href="/admin/pages?status=PUBLISHED"
          className={`border border-line px-2 py-1 ${status === 'PUBLISHED' ? 'bg-line' : ''}`}
        >
          Đã xuất bản
        </Link>
        <Link
          href="/admin/pages?status=DRAFT"
          className={`border border-line px-2 py-1 ${status === 'DRAFT' ? 'bg-line' : ''}`}
        >
          Nháp
        </Link>
      </nav>

      {pages.length === 0 ? (
        <p className="text-sm text-muted">Chưa có trang nào.</p>
      ) : (
        <table className="w-full max-w-prose text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2">Tiêu đề</th>
              <th className="py-2">Trạng thái</th>
              <th className="py-2">Cập nhật</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-2 font-ui">{p.title}</td>
                <td className="py-2">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="py-2 text-xs text-muted">{p.updatedAt.toISOString()}</td>
                <td className="py-2 text-right">
                  <Link
                    href={`/admin/pages/${p.id}/edit`}
                    className="text-xs underline hover:no-underline"
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
