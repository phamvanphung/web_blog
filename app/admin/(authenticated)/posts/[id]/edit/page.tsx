import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPost, publishPost, deletePost } from '@/modules/posts/server';
import { listCategories } from '@/modules/categories/server';
import { listTags } from '@/modules/tags/server';
import { listMedia } from '@/modules/media/server';
import { Tiptap } from '@/components/editor/Tiptap';
import { PostTaxonomyPanel } from '@/components/editor/PostTaxonomyPanel';
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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tiptap
            initialContent={initialContent as never}
            initialTitle={post.title}
            postId={post.id}
            initialStatus={post.status}
          />
        </div>
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
  );
}
