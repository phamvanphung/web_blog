import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getPage } from '@/modules/pages/server';
import type { Section } from '@/modules/pages/types';
import { PageForm } from '../../PageForm';
import { deletePageAction } from '../../actions';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';

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
          <form action={deletePageAction}>
            <input type="hidden" name="id" value={page.id} />
            <button type="submit" className="text-[13px] text-[#d70015] hover:underline">
              Xóa trang
            </button>
          </form>
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
