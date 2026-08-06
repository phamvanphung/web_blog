import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { getPost, publishPost, deletePost } from '@/modules/posts/server';
import { Tiptap } from '@/components/editor/Tiptap';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

// Inline Server Actions — `deletePost()` already audits + revalidates internally,
// so the wrapper only needs role check + redirect.
async function publishAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') ?? '');
  await publishPost(id);
  revalidatePath(`/admin/posts/${id}/edit`);
  revalidatePath('/admin/posts');
}

async function deleteAction(formData: FormData) {
  'use server';
  await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  await deletePost(id);
  // After delete, the edit page would re-render the (now-trashed) record.
  // Bounce back to the list instead.
  redirect('/admin/posts?status=TRASHED');
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const initialContent = post.contentJson ?? { type: 'doc', content: [{ type: 'paragraph' }] };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-ui text-2xl">
          {post.status === 'PUBLISHED' ? 'Sửa (đã xuất bản)' : 'Sửa bài viết'}
        </h1>
        <div className="flex gap-2">
          {post.status !== 'PUBLISHED' && (
            <form action={publishAction}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" size="sm">
                Publish
              </Button>
            </form>
          )}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="border border-line px-3 py-1 text-sm hover:bg-line/40">
              Xóa
            </button>
          </form>
        </div>
      </header>

      <Tiptap initialContent={initialContent as never} initialTitle={post.title} postId={post.id} />
    </div>
  );
}
