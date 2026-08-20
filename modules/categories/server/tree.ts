// modules/categories/server/tree.ts
// Build a parent-child tree from a flat Category list.

export type FlatCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  groupName?: string | null;
  hidden?: boolean;
};

export type CategoryNode = FlatCategory & {
  children: CategoryNode[];
};

export function buildCategoryTree(flat: FlatCategory[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  for (const c of flat) byId.set(c.id, { ...c, children: [] });
  const roots: CategoryNode[] = [];
  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
