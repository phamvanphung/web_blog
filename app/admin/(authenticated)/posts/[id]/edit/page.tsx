import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPost, publishPost, unpublishPost, deletePost } from '@/modules/posts/server';
import { listCategories } from '@/modules/categories/server';
import { listTags } from '@/modules/tags/server';
import { listMedia } from '@/modules/media/server';
import { PostEditor } from '@/components/editor/PostEditor';
import { PostTaxonomyPanel } from '@/components/editor/PostTaxonomyPanel';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

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
  redirect('/admin/posts?status=TRASHED');
}

async function unpublishAction(formData: FormData) {
  'use server';
  await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  await unpublishPost(id);
  revalidatePath(`/admin/posts/${id}/edit`);
  revalidatePath('/admin/posts');
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const [categories, tags, mediaPage, postWithRel] = await Promise.all([
    listCategories(),
    listTags(),
    listMedia({ take: 12 }),
    db.post.findUnique({
      where: { id: post.id },
      include: { categories: { select: { categoryId: true } }, tags: { select: { tagId: true } } }
    })
  ]);

  const initialContent = post.contentJson ?? { type: 'doc', content: [{ type: 'paragraph' }] };
  const initialCategoryIds = postWithRel?.categories.map((c) => c.categoryId) ?? [];
  const initialTagIds = postWithRel?.tags.map((t) => t.tagId) ?? [];

  return (
    <div className="space-y-8">
      <header>
        <AdminBreadcrumb
          items={[
            { href: '/admin/posts', label: 'Bài viết' },
            { label: post.title || 'Sửa' }
          ]}
        />
        <div className="flex items-center justify-between">
          <h1 className="text-d-sm">
            {post.status === 'PUBLISHED' ? 'Sửa (đã xuất bản)' : 'Sửa bài viết'}
          </h1>
        <div className="flex items-center gap-4">
          {post.status !== 'PUBLISHED' ? (
            <form action={publishAction}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" variant="primary-pill" size="sm">
                Publish
              </Button>
            </form>
          ) : (
            <form action={unpublishAction}>
              <input type="hidden" name="id" value={post.id} />
              <Button type="submit" variant="secondary-pill" size="sm">
                Chuyển về nháp
              </Button>
            </form>
          )}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="text-[13px] text-error hover:underline">
              Xóa
            </button>
          </form>
        </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start">
        <div className="min-w-0 flex-1">
          <PostEditor
            initialContent={initialContent}
            initialTitle={post.title}
            postId={post.id}
            initialStatus={post.status}
          />
        </div>
        <div className="2xl:w-[400px] 2xl:flex-shrink-0">
        <PostTaxonomyPanel
          postId={post.id}
          initialCategoryIds={initialCategoryIds}
          initialTagIds={initialTagIds}
          initialFeaturedMediaId={post.featuredMediaId}
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
          tags={tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
          recentMedia={mediaPage.items.map((m) => ({
            id: m.id,
            url: m.url,
            altText: m.altText
          }))}
        />
        </div>
      </div>
    </div>
  );
}
