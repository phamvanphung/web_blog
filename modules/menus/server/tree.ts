// modules/menus/server/tree.ts
// Build hierarchical MenuItem tree from a flat list.

export type FlatMenuItem = {
  id: string;
  label: string;
  parentId: string | null;
  sortOrder: number;
  targetType: 'PAGE' | 'POST' | 'CATEGORY' | 'EXTERNAL';
  targetId: string | null;
  externalUrl: string | null;
  openInNew: boolean;
  isVisible: boolean;
};

export type MenuItemNode = FlatMenuItem & {
  children: MenuItemNode[];
};

export function buildMenuTree(flat: FlatMenuItem[]): MenuItemNode[] {
  const byId = new Map<string, MenuItemNode>();
  for (const it of flat) byId.set(it.id, { ...it, children: [] });
  const roots: MenuItemNode[] = [];
  for (const it of flat) {
    const node = byId.get(it.id)!;
    if (it.parentId && byId.has(it.parentId)) {
      byId.get(it.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortByOrder = (a: MenuItemNode, b: MenuItemNode) => a.sortOrder - b.sortOrder;
  roots.sort(sortByOrder);
  const sortChildren = (n: MenuItemNode) => {
    n.children.sort(sortByOrder);
    n.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);
  return roots;
}
