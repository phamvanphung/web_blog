// app/admin/(authenticated)/menus/[id]/edit/MenuItemRow.tsx
// Single row in the menu editor.
//
// Replaces the inline ItemRow that previously lived inside MenuEditor.tsx.
// Adds two capabilities on top of the prior behaviour:
//   • Inline edit form (target label/URL/parent/visibility) — mirrors the
//     pattern in `app/admin/(authenticated)/categories/CategoryRow.tsx`.
//   • Drag-and-drop reorder — HTML5 native (matching `SectionList.tsx`),
//     enabled only on flat rows (depth === 0). Drag state is lifted into
//     the parent `MenuEditor` so the parent owns the visual cue (faded
//     source + drop-top-border on target).
//
// Nested children (depth > 0) keep the legacy read-only view: no drag
// handle, no "Sửa" button, the visibility/delete forms remain so admins
// can still prune without flattening the tree by accident.

'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { MenuItemNode } from '@/modules/menus/server/tree';
import {
  updateMenuItemAction,
  type MenuItemFormState
} from './actions';

type Props = {
  item: MenuItemNode;
  depth: number;
  /** Editable rows get the "Sửa" button + inline form. */
  editable: boolean;
  /** Draggable rows wire up onDragStart/onDragOver/onDrop. */
  draggable: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  isReordering: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string) => void;
  deleteAction: (formData: FormData) => Promise<void>;
  toggleVisibleAction: (formData: FormData) => Promise<void>;
};

const inputClass =
  'h-9 w-full rounded-8 border border-hairline bg-canvas px-3 text-[13px] text-ink outline-none focus:border-primary-focus';
const labelClass = 'mb-1 block text-[11px] text-ink-48 uppercase tracking-wide';

function hrefFor(item: MenuItemNode): string {
  if (item.targetType === 'EXTERNAL') return item.externalUrl ?? '#';
  return `/${item.targetType.toLowerCase()}/${item.targetId ?? ''}`;
}

export function MenuItemRow({
  item,
  depth,
  editable,
  draggable,
  isDragSource,
  isDropTarget,
  isReordering,
  onDragStart,
  onDragEnd,
  onDrop,
  deleteAction,
  toggleVisibleAction
}: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<
    MenuItemFormState | undefined,
    FormData
  >(updateMenuItemAction, undefined);

  useEffect(() => {
    if (state?.ok === true) setEditing(false);
  }, [state]);

  const href = hrefFor(item);

  // ----- Edit form -----
  if (editing && editable) {
    return (
      <li
        className="rounded-8 border border-hairline bg-canvas-parchment p-4"
        style={{ marginLeft: depth * 16 }}
      >
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Label</label>
              <input
                name="label"
                defaultValue={item.label}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target type</label>
              <select
                name="targetType"
                defaultValue={item.targetType}
                className={inputClass}
              >
                <option value="EXTERNAL">External URL</option>
                <option value="PAGE">Page</option>
                <option value="POST">Post</option>
                <option value="CATEGORY">Category</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>External URL (nếu EXTERNAL)</label>
            <input
              name="externalUrl"
              type="url"
              defaultValue={item.externalUrl ?? ''}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className={labelClass}>
              Target ID (nếu PAGE / POST / CATEGORY)
            </label>
            <input
              name="targetId"
              defaultValue={item.targetId ?? ''}
              className={inputClass}
              placeholder="cuid của target…"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[12px] text-ink-80">
              {/* Hidden zero so unchecked box posts `openInNew=false`. */}
              <input type="hidden" name="openInNew" value="false" />
              <input
                type="checkbox"
                name="openInNew"
                value="on"
                defaultChecked={item.openInNew}
                className="h-4 w-4 rounded border-hairline"
              />
              Mở tab mới
            </label>
            <label className="flex items-center gap-2 text-[12px] text-ink-80">
              <input type="hidden" name="isVisible" value="false" />
              <input
                type="checkbox"
                name="isVisible"
                value="on"
                defaultChecked={item.isVisible}
                className="h-4 w-4 rounded border-hairline"
              />
              Hiện
            </label>
          </div>

          {state?.ok === false && (
            <p role="alert" className="text-[12px] text-error">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary-pill"
              size="sm"
              disabled={pending}
            >
              {pending ? 'Đang lưu…' : 'Lưu'}
            </Button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-8 border border-hairline px-3 py-1 text-[12px] text-ink-80 hover:bg-canvas"
            >
              Hủy
            </button>
          </div>
        </form>
      </li>
    );
  }

  // ----- View / read-only row -----
  return (
    <li
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = 'move';
        // Some browsers (Safari) require setData to start a drag.
        e.dataTransfer.setData('text/plain', item.id);
        onDragStart(item.id);
      }}
      onDragEnd={() => onDragEnd()}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDrop(item.id);
      }}
      aria-grabbed={draggable ? isDragSource : undefined}
      className={`flex items-center justify-between gap-3 border-b border-hairline py-3 ${
        isDragSource ? 'opacity-50' : ''
      } ${
        isDropTarget ? 'border-t-2 border-t-primary bg-canvas-parchment/40' : ''
      } ${draggable ? 'cursor-grab' : ''}`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {draggable && (
          <span
            className="cursor-grab select-none text-ink-48"
            aria-hidden="true"
            title="Kéo để sắp xếp"
          >
            ☰
          </span>
        )}
        <span className="min-w-0 truncate">
          <span className="text-ink">{item.label}</span>{' '}
          <a
            href={href}
            className="ml-2 text-[12px] text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {href}
          </a>
        </span>
      </div>
      <div className="flex items-center gap-4 text-[12px]">
        {isReordering && draggable && (
          <span className="text-ink-48">Đang lưu…</span>
        )}
        <form action={toggleVisibleAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <label className="flex items-center gap-2 text-ink-80">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={item.isVisible}
              onChange={(e) =>
                (e.currentTarget.form as HTMLFormElement).requestSubmit()
              }
            />
            Hiện
          </label>
        </form>
        {editable && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-8 border border-hairline px-3 py-1 text-ink hover:bg-canvas-parchment"
          >
            Sửa
          </button>
        )}
        <form action={deleteAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button
            type="submit"
            className="text-error hover:underline"
          >
            Xóa
          </button>
        </form>
      </div>

      {/* Nested children render as siblings under the parent <li>, per the
          pre-existing tree contract. depth+1, no drag, no edit. */}
      {item.children.length > 0 && (
        <ul className="ml-4 w-full space-y-1 text-[13px]">
          {item.children.map((c) => (
            <MenuItemRow
              key={c.id}
              item={c}
              depth={depth + 1}
              editable={false}
              draggable={false}
              isDragSource={false}
              isDropTarget={false}
              isReordering={false}
              onDragStart={() => {
                /* no-op for nested */
              }}
              onDragEnd={() => {
                /* no-op */
              }}
              onDrop={() => {
                /* no-op */
              }}
              deleteAction={deleteAction}
              toggleVisibleAction={toggleVisibleAction}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
