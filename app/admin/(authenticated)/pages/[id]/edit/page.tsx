import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getPage } from '@/modules/pages/server';
import { PageForm } from '../../PageForm';
import { updatePageAction, deletePageAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-d-sm">Sửa trang</h1>
        <form action={deletePageAction}>
          <input type="hidden" name="id" value={page.id} />
          <button type="submit" className="text-[13px] text-[#d70015] hover:underline">
            Xóa trang
          </button>
        </form>
      </header>

      <PageForm
        mode="edit"
        pageId={page.id}
        initial={{
          title: page.title,
          content: page.content,
          status: page.status as 'DRAFT' | 'PUBLISHED' | 'HIDDEN'
        }}
        action={updatePageAction}
      />
    </div>
  );
}
