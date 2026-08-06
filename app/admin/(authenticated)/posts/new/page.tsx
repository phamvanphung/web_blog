// app/admin/(authenticated)/posts/new/page.tsx
import { Tiptap } from '@/components/editor/Tiptap';
import { PostTaxonomyPanel } from '@/components/editor/PostTaxonomyPanel';
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
      <h1 className="mb-2 text-3xl">Bài viết mới</h1>
      <p className="mb-6 text-sm text-muted">
        Soạn nội dung, click <strong>Lưu nháp</strong> khi xong. Sau khi lưu, có thể publish.
      </p>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tiptap initialContent={empty} postId={null} />
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
