import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getPage } from '@/modules/pages/server';
import type { Section } from '@/modules/pages/types';
import { PageForm } from '../../PageForm';
import { deletePageAction } from '../../actions';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div className="space-y-8">
      <header>
        <AdminBreadcrumb
          items={[{ href: '/admin/pages', label: 'Trang' }, { label: page.title || 'Sửa' }]}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-d-sm">Sửa trang</h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/pages/${page.id}/preview`}
              target="_blank"
              className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink hover:bg-canvas-parchment"
            >
              Xem trước ↗
            </Link>
            <form action={deletePageAction}>
              <input type="hidden" name="id" value={page.id} />
              <button type="submit" className="text-[13px] text-error hover:underline">
                Xóa trang
              </button>
            </form>
          </div>
        </div>
      </header>

      <PageForm
        initial={{
          id: page.id,
          title: page.title,
          status: page.status as 'DRAFT' | 'PUBLISHED' | 'HIDDEN',
          sections: (page.sections as Section[]) ?? []
        }}
      />
    </div>
  );
}
