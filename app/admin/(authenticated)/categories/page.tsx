import { requireRole } from '@/lib/auth';
import { listCategories, listCategoryGroupsForAdmin } from '@/modules/categories/server';
import { buildCategoryTree } from '@/modules/categories/server/tree';
import { CategoryForm } from './CategoryForm';
import { CategoryRow } from './CategoryRow';

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
      description: c.description,
      groupId: c.groupId,
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
      <CategoryTreeView
        nodes={tree}
        parents={flat.map((c) => ({ id: c.id, name: c.name }))}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}

type Node = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string | null;
  groupId?: string | null;
  hidden?: boolean;
  groupName?: string | null;
  children: Node[];
};

function CategoryTreeView({
  nodes,
  parents,
  groups,
  depth = 0
}: {
  nodes: Node[];
  parents: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  depth?: number;
}) {
  if (nodes.length === 0) {
    return <p className="text-[13px] text-ink-48">Chưa có category nào.</p>;
  }
  return (
    <ul className="space-y-2">
      {nodes.map((n) => (
        <li key={n.id}>
          <CategoryRow
            category={n}
            parents={parents}
            groups={groups}
            depth={depth}
          />
          {n.children.length > 0 && (
            <CategoryTreeView
              nodes={n.children}
              parents={parents}
              groups={groups}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
