// app/admin/(authenticated)/posts/new/page.tsx
import { PostEditor } from '@/components/editor/PostEditor';
import { PostTaxonomyPanel } from '@/components/editor/PostTaxonomyPanel';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { listCategories } from '@/modules/categories/server';
import { listTags } from '@/modules/tags/server';
import { listMedia } from '@/modules/media/server';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const [categories, tags, mediaPage] = await Promise.all([
    listCategories(),
    listTags(),
    listMedia({ take: 12 })
  ]);

  const empty = { type: 'doc', content: [{ type: 'paragraph' }] };
  return (
    <div>
      <AdminBreadcrumb items={[{ href: '/admin/posts', label: 'Bài viết' }, { label: 'Mới' }]} />
      <h1 className="mb-2 text-d-sm">Bài viết mới</h1>
      <p className="mb-6 text-[13px] text-ink-48">
        Soạn nội dung, click <strong>Lưu nháp</strong> khi xong. Sau khi lưu, có thể publish.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PostEditor initialContent={empty} postId={null} />
        </div>
        <PostTaxonomyPanel
          postId={null}
          initialCategoryIds={[]}
          initialTagIds={[]}
          initialFeaturedMediaId={null}
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
