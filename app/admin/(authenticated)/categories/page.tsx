import { requireRole } from '@/lib/auth';
import { listCategories, listCategoryGroupsForAdmin } from '@/modules/categories/server';
import { buildCategoryTree } from '@/modules/categories/server/tree';
import { CategoryForm } from './CategoryForm';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireRole('ADMIN');
  const flat = await listCategories();
  const tree = buildCategoryTree(
    flat.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      groupName: c.group?.name ?? null,
      hidden: c.hidden
    }))
  );
  const groups = await listCategoryGroupsForAdmin();

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Categories</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Cây phân cấp — slug tự sinh từ tên (đổi slug qua DB nếu cần giữ URL cũ).
      </p>

      <CategoryForm
        parents={flat.map((c) => ({ id: c.id, name: c.name }))}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />

      <h2 className="mb-3 mt-12 text-[21px] font-semibold tracking-tight">Cây hiện tại</h2>
      <CategoryTreeView nodes={tree} />
    </div>
  );
}

type Node = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  groupName?: string | null;
  hidden?: boolean;
  children: Node[];
};

function CategoryTreeView({ nodes }: { nodes: Node[] }) {
  if (nodes.length === 0) {
    return <p className="text-[13px] text-ink-48">Chưa có category nào.</p>;
  }
  return (
    <ul className="space-y-1 text-[13px]">
      {nodes.map((n) => (
        <li key={n.id}>
          <span className="text-ink">{n.name}</span>
          <span className="text-ink-48"> · /{n.slug}</span>
          {n.groupName && (
            <span className="ml-2 rounded-6 bg-canvas-parchment px-2 py-0.5 text-[11px] text-ink-48">
              {n.groupName}
            </span>
          )}
          {n.hidden && (
            <span className="ml-2 rounded-6 bg-[#fde8eb] px-2 py-0.5 text-[11px] text-[#a3151f]">
              Ẩn
            </span>
          )}
          {n.children.length > 0 && (
            <ul className="ml-4 mt-1 space-y-1 border-l border-hairline pl-4">
              {n.children.map((c) => (
                <li key={c.id}>
                  <span className="text-ink">{c.name}</span>
                  <span className="text-ink-48"> · /{c.slug}</span>
                  {c.groupName && (
                    <span className="ml-2 rounded-6 bg-canvas-parchment px-2 py-0.5 text-[11px] text-ink-48">
                      {c.groupName}
                    </span>
                  )}
                  {c.hidden && (
                    <span className="ml-2 rounded-6 bg-[#fde8eb] px-2 py-0.5 text-[11px] text-[#a3151f]">
                      Ẩn
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
