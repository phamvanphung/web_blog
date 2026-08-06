import { describe, it, expect } from 'vitest';
import { buildMenuTree } from '@/modules/menus/server/tree';

describe('buildMenuTree', () => {
  it('builds a 2-level tree from a flat list ordered by sortOrder', () => {
    const flat = [
      { id: 'p1', label: 'Dự án', parentId: null, sortOrder: 0, targetType: 'EXTERNAL', targetId: null, externalUrl: '/du-an', openInNew: false, isVisible: true },
      { id: 'p2', label: 'Quá trình', parentId: null, sortOrder: 1, targetType: 'EXTERNAL', targetId: null, externalUrl: '/qua-trinh', openInNew: false, isVisible: true },
      { id: 'c1', label: 'Web', parentId: 'p1', sortOrder: 0, targetType: 'EXTERNAL', targetId: null, externalUrl: '/du-an/web', openInNew: false, isVisible: true }
    ];
    const tree = buildMenuTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree[0]!.id).toBe('p1');
    expect(tree[0]!.children).toHaveLength(1);
    expect(tree[0]!.children[0]!.id).toBe('c1');
    expect(tree[1]!.children).toHaveLength(0);
  });

  it('orders siblings by sortOrder ascending', () => {
    const flat = [
      { id: 'a', label: 'A', parentId: null, sortOrder: 1, targetType: 'EXTERNAL', targetId: null, externalUrl: '/a', openInNew: false, isVisible: true },
      { id: 'b', label: 'B', parentId: null, sortOrder: 0, targetType: 'EXTERNAL', targetId: null, externalUrl: '/b', openInNew: false, isVisible: true }
    ];
    const tree = buildMenuTree(flat);
    expect(tree[0]!.id).toBe('b');
    expect(tree[1]!.id).toBe('a');
  });

  it('promotes orphans to root', () => {
    const flat = [
      { id: 'x', label: 'X', parentId: 'missing', sortOrder: 0, targetType: 'EXTERNAL', targetId: null, externalUrl: '/x', openInNew: false, isVisible: true }
    ];
    expect(buildMenuTree(flat)).toHaveLength(1);
  });

  it('returns [] for empty input', () => {
    expect(buildMenuTree([])).toEqual([]);
  });
});
