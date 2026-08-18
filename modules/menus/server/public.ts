// modules/menus/server/public.ts
// Public-facing menu API: pull by location, resolve each item's href from
// targetType + targetId (joined to Page/Post/Category slug where needed).

import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { buildMenuTree, type FlatMenuItem, type MenuItemNode } from './tree';

export type MenuHrefInput = {
  type: 'PAGE' | 'POST' | 'CATEGORY' | 'EXTERNAL';
  targetId: string | null;
  externalUrl: string | null;
  targetSlug: string | null;
};

/** Resolve one menu item's frontend URL. Pure function — easy to unit test. */
export function resolveMenuItemHref(input: MenuHrefInput): string {
  if (input.type === 'EXTERNAL') return input.externalUrl ?? '#';
  if (!input.targetSlug) return '#';
  if (input.type === 'PAGE') return `/${input.targetSlug}`;
  if (input.type === 'POST') return `/blog/${input.targetSlug}`;
  if (input.type === 'CATEGORY') return `/chu-de/${input.targetSlug}`;
  return '#';
}

type IdSlug = { id: string; slug: string };

function idsOfType<T extends { type: string; targetId: string | null }>(
  items: T[],
  type: string
): string[] {
  return items.filter((i) => i.type === type && i.targetId).map((i) => i.targetId!);
}

function decorateWithHref(
  node: MenuItemNode,
  pageMap: Map<string, IdSlug>,
  postMap: Map<string, IdSlug>,
  categoryMap: Map<string, IdSlug>
): MenuItemNode & { href: string } {
  const targetSlug =
    node.targetType === 'PAGE'
      ? pageMap.get(node.targetId ?? '')?.slug ?? null
      : node.targetType === 'POST'
        ? postMap.get(node.targetId ?? '')?.slug ?? null
        : node.targetType === 'CATEGORY'
          ? categoryMap.get(node.targetId ?? '')?.slug ?? null
          : null;
  const href = resolveMenuItemHref({
    type: node.targetType,
    targetId: node.targetId,
    externalUrl: node.externalUrl,
    targetSlug
  });
  return {
    ...node,
    href,
    children: node.children.map((c) => decorateWithHref(c, pageMap, postMap, categoryMap))
  };
}

/** Fetch the menu `location` (e.g. 'primary'), resolve each item to its href, return visible tree. */
async function getMenuByLocationUncached(
  location: string
): Promise<(MenuItemNode & { href: string })[]> {
  const menu = await db.menu.findFirst({
    where: { location },
    include: { items: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!menu) return [];

  type RawItem = (typeof menu.items)[number];
  const [pageRows, postRows, categoryRows] = await Promise.all([
    db.page.findMany({
      where: { id: { in: idsOfType(menu.items, 'PAGE') } },
      select: { id: true, slug: true }
    }),
    db.post.findMany({
      where: { id: { in: idsOfType(menu.items, 'POST') } },
      select: { id: true, slug: true }
    }),
    db.category.findMany({
      where: { id: { in: idsOfType(menu.items, 'CATEGORY') } },
      select: { id: true, slug: true }
    })
  ]);
  const pageMap = new Map<string, IdSlug>(pageRows.map((r) => [r.id, r]));
  const postMap = new Map<string, IdSlug>(postRows.map((r) => [r.id, r]));
  const categoryMap = new Map<string, IdSlug>(categoryRows.map((r) => [r.id, r]));

  const flat: FlatMenuItem[] = (menu.items as RawItem[])
    .filter((it) => it.isVisible)
    .map((it) => ({
      id: it.id,
      label: it.label,
      parentId: it.parentId,
      sortOrder: it.sortOrder,
      targetType: it.type,
      targetId: it.targetId,
      externalUrl: it.externalUrl,
      openInNew: it.openInNew,
      isVisible: it.isVisible
    }));

  const tree = buildMenuTree(flat);
  return tree.map((n) => decorateWithHref(n, pageMap, postMap, categoryMap));
}

/**
 * Cached variant of `getMenuByLocation`. Persists across requests keyed by
 * `location` so the 4-query waterfall only fires once per 5 minutes (or
 * until invalidated via `revalidateTag('menu:<location>')` from admin mutations).
 */
export function getMenuByLocation(
  location: string
): Promise<(MenuItemNode & { href: string })[]> {
  return unstable_cache(
    () => getMenuByLocationUncached(location),
    ['menu', location],
    { tags: [`menu:${location}`], revalidate: 300 }
  )();
}
