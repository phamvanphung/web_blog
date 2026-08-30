'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import type { MenuItemNode } from '@/modules/menus/server/tree';
import { MenuItemRow } from './[id]/edit/MenuItemRow';

type Props = {
  menuId: string;
  items: MenuItemNode[];
  addAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  toggleVisibleAction: (formData: FormData) => Promise<void>;
  reorderAction: (formData: FormData) => Promise<void>;
};

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function MenuEditor({
  menuId,
  items,
  addAction,
  deleteAction,
  toggleVisibleAction,
  reorderAction
}: Props) {
  // Drag state lives at the parent so we can:
  //   • highlight the source row (faded) and the target row (border-top).
  //   • disable drag while a reorder server action is in flight.
  const [dragId, setDragId] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragEnd = () => setDragId(null);

  const handleDrop = (targetId: string) => {
    const sourceId = dragId;
    setDragId(null);
    if (!sourceId || sourceId === targetId) return;

    // Compute the new flat order. Children of moved items are not part of
    // `orderedIds` — they keep their existing (per-parent) sortOrder on the
    // server side because the reorder action only touches the supplied ids.
    const sourceIdx = items.findIndex((it) => it.id === sourceId);
    const targetIdx = items.findIndex((it) => it.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const next = items.slice();
    const [moved] = next.splice(sourceIdx, 1) as [MenuItemNode];
    next.splice(targetIdx, 0, moved);

    const formData = new FormData();
    formData.set('menuId', menuId);
    formData.set('orderedIds', next.map((it) => it.id).join(','));

    startReorderTransition(() => {
      void reorderAction(formData);
    });
  };

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
          items.map((it) => {
            const isDragSource = dragId === it.id;
            const isDropTarget = dragId !== null && dragId !== it.id;
            return (
              <MenuItemRow
                key={it.id}
                item={it}
                depth={0}
                editable={true}
                draggable={!isReordering}
                isDragSource={isDragSource}
                isDropTarget={isDropTarget}
                isReordering={isReordering}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                deleteAction={deleteAction}
                toggleVisibleAction={toggleVisibleAction}
              />
            );
          })
        )}
      </ul>
    </div>
  );
}
