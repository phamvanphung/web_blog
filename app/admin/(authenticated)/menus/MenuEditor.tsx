'use client';

import { Button } from '@/components/ui/Button';
import type { MenuItemNode } from '@/modules/menus/server/tree';

type Props = {
  menuId: string;
  items: MenuItemNode[];
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  toggleVisibleAction: (formData: FormData) => Promise<void>;
};

export function MenuEditor({
  menuId,
  items,
  addAction,
  deleteAction,
  toggleVisibleAction
}: Props) {
  return (
    <div className="max-w-prose space-y-6">
      <form action={addAction} className="space-y-3 border-b border-line pb-6">
        <input type="hidden" name="menuId" value={menuId} />
        <div>
          <label className="mb-1 block text-sm">Label</label>
          <input
            name="label"
            required
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm">Target type</label>
            <select
              name="targetType"
              defaultValue="EXTERNAL"
              className="w-full border border-line bg-bg px-3 py-2 text-sm"
            >
              <option value="EXTERNAL">External URL</option>
              <option value="PAGE">Page</option>
              <option value="POST">Post</option>
              <option value="CATEGORY">Category</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">External URL (nếu EXTERNAL)</label>
            <input
              name="externalUrl"
              type="url"
              placeholder="https://…"
              className="w-full border border-line bg-bg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm">Target ID (nếu PAGE / POST / CATEGORY)</label>
          <input
            name="targetId"
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
            placeholder="cuid của target…"
          />
        </div>
        <Button type="submit" size="sm">
          + Thêm item
        </Button>
      </form>

      <ul className="space-y-1 text-sm">
        {items.length === 0 ? (
          <li className="text-muted">Chưa có item.</li>
        ) : (
          items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              depth={0}
              deleteAction={deleteAction}
              toggleVisibleAction={toggleVisibleAction}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function ItemRow({
  item,
  depth,
  deleteAction,
  toggleVisibleAction
}: {
  item: MenuItemNode;
  depth: number;
  deleteAction: (formData: FormData) => Promise<void>;
  toggleVisibleAction: (formData: FormData) => Promise<void>;
}) {
  const href =
    item.targetType === 'EXTERNAL'
      ? item.externalUrl ?? '#'
      : `/${item.targetType.toLowerCase()}/${item.targetId ?? ''}`;
  return (
    <li className="border-b border-line py-2" style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center justify-between">
        <span>
          <span className="font-ui">{item.label}</span>{' '}
          <a href={href} className="ml-2 text-xs text-muted underline hover:no-underline">
            {href}
          </a>
        </span>
        <div className="flex items-center gap-3 text-xs">
          <form action={toggleVisibleAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                name="visible"
                defaultChecked={item.isVisible}
                onChange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
              />
              Hiện
            </label>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" className="text-muted underline hover:no-underline">
              Xóa
            </button>
          </form>
        </div>
      </div>
      {item.children.length > 0 && (
        <ul>
          {item.children.map((c) => (
            <ItemRow
              key={c.id}
              item={c}
              depth={depth + 1}
              deleteAction={deleteAction}
              toggleVisibleAction={toggleVisibleAction}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
