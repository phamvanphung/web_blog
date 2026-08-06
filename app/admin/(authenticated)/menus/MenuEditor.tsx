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

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function MenuEditor({
  menuId,
  items,
  addAction,
  deleteAction,
  toggleVisibleAction
}: Props) {
  return (
    <div className="max-w-prose space-y-6">
      <form action={addAction} className="space-y-4 border-b border-hairline pb-6">
        <input type="hidden" name="menuId" value={menuId} />
        <div>
          <label className={labelClass}>Label</label>
          <input name="label" required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>Target type</label>
            <select
              name="targetType"
              defaultValue="EXTERNAL"
              className={inputClass}
            >
              <option value="EXTERNAL">External URL</option>
              <option value="PAGE">Page</option>
              <option value="POST">Post</option>
              <option value="CATEGORY">Category</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>External URL (nếu EXTERNAL)</label>
            <input
              name="externalUrl"
              type="url"
              placeholder="https://…"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Target ID (nếu PAGE / POST / CATEGORY)</label>
          <input
            name="targetId"
            className={inputClass}
            placeholder="cuid của target…"
          />
        </div>
        <Button type="submit" variant="primary-pill" size="sm">
          + Thêm item
        </Button>
      </form>

      <ul className="space-y-1 text-[13px]">
        {items.length === 0 ? (
          <li className="text-ink-48">Chưa có item.</li>
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
    <li
      className="border-b border-hairline py-3"
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="text-ink">{item.label}</span>{' '}
          <a href={href} className="ml-2 text-[12px] text-primary hover:underline">
            {href}
          </a>
        </span>
        <div className="flex items-center gap-4 text-[12px]">
          <form action={toggleVisibleAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <label className="flex items-center gap-2 text-ink-80">
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
            <button type="submit" className="text-[#d70015] hover:underline">
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
