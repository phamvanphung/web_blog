import { requireRole } from '@/lib/auth';
import { listCategories } from '@/modules/categories/server';
import { buildCategoryTree } from '@/modules/categories/server/tree';
import { CategoryForm } from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireRole('ADMIN');
  const flat = await listCategories();
  const tree = buildCategoryTree(
    flat.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId }))
  );

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Categories</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Cây phân cấp — slug tự sinh từ tên (đổi slug qua DB nếu cần giữ URL cũ).
      </p>

      <CategoryForm parents={flat.map((c) => ({ id: c.id, name: c.name }))} />

      <h2 className="mb-3 mt-12 text-[21px] font-semibold tracking-tight">Cây hiện tại</h2>
      <CategoryTreeView nodes={tree} />
    </div>
  );
}

function CategoryTreeView({ nodes }: { nodes: ReturnType<typeof buildCategoryTree> }) {
  if (nodes.length === 0) {
    return <p className="text-[13px] text-ink-48">Chưa có category nào.</p>;
  }
  return (
    <ul className="space-y-1 text-[13px]">
      {nodes.map((n) => (
        <li key={n.id}>
          <span className="text-ink">{n.name}</span>
          <span className="text-ink-48"> · /{n.slug}</span>
          {n.children.length > 0 && (
            <ul className="ml-4 mt-1 space-y-1 border-l border-hairline pl-4">
              {n.children.map((c) => (
                <li key={c.id}>
                  <span className="text-ink">{c.name}</span>
                  <span className="text-ink-48"> · /{c.slug}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
