import { describe, it, expect } from 'vitest';
import { buildCategoryTree } from '@/modules/categories/server/tree';

describe('buildCategoryTree', () => {
  it('builds a 2-level tree from a flat list', () => {
    const flat = [
      { id: '1', name: 'Dự án', slug: 'du-an', parentId: null },
      { id: '2', name: 'Quá trình', slug: 'qua-trinh', parentId: null },
      { id: '3', name: 'Web', slug: 'web', parentId: '1' }
    ];
    const tree = buildCategoryTree(flat);
    expect(tree).toHaveLength(2);
    expect(tree[0]!.id).toBe('1');
    expect(tree[0]!.children).toHaveLength(1);
    expect(tree[0]!.children[0]!.id).toBe('3');
    expect(tree[1]!.children).toHaveLength(0);
  });

  it('handles orphans (parent missing from list) by treating them as roots', () => {
    const flat = [{ id: '1', name: 'Web', slug: 'web', parentId: '99' }];
    const tree = buildCategoryTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.id).toBe('1');
  });

  it('returns [] for empty input', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });
});
