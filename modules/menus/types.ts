import type { Menu, MenuItem } from '@prisma/client';

export type MenuItemNode = MenuItem & { children: MenuItemNode[] };
export type MenuWithItems = Menu & { items: MenuItemNode[] };
