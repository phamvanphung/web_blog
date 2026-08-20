'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateCategoryAction, deleteCategoryAction, type CategoryFormState } from './actions';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string | null;
  groupId?: string | null;
  hidden?: boolean;
  groupName?: string | null;
};

type Props = {
  category: Category;
  parents: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  depth: number;
};

const inputClass =
  'h-9 w-full rounded-8 border border-hairline bg-canvas px-3 text-[13px] text-ink outline-none focus:border-primary-focus';
const labelClass = 'mb-1 block text-[11px] text-ink-48 uppercase tracking-wide';

export function CategoryRow({ category, parents, groups, depth }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    updateCategoryAction,
    undefined
  );

  useEffect(() => {
    if (state?.ok === true) setEditing(false);
  }, [state]);

  const parentOptions = parents.filter((p) => p.id !== category.id);

  if (editing) {
    return (
      <li
        className="rounded-8 border border-hairline bg-canvas-parchment p-4"
        style={{ marginLeft: depth * 16 }}
      >
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="hidden" value="false" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tên</label>
              <input name="name" defaultValue={category.name} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Parent</label>
              <select name="parentId" defaultValue={category.parentId ?? ''} className={inputClass}>
                <option value="">— Root —</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Mô tả</label>
            <textarea
              name="description"
              defaultValue={category.description ?? ''}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Group</label>
              <select
                name="groupId"
                defaultValue={category.groupId ?? ''}
                className={inputClass}
              >
                <option value="">— Default —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[12px] text-ink-80">
                <input
                  type="checkbox"
                  name="hidden"
                  value="true"
                  defaultChecked={category.hidden}
                  className="h-4 w-4 rounded border-hairline"
                />
                Ẩn khỏi public
              </label>
            </div>
          </div>

          {state?.ok === false && (
            <p role="alert" className="text-[12px] text-[#d70015]">{state.error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
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

  return (
    <li
      className="flex flex-wrap items-center gap-2 rounded-8 border border-hairline bg-canvas px-3 py-2"
      style={{ marginLeft: depth * 16 }}
    >
      <span className="font-medium text-ink">{category.name}</span>
      <span className="text-ink-48">/{category.slug}</span>
      {category.groupName && (
        <span className="rounded-6 bg-canvas-parchment px-2 py-0.5 text-[11px] text-ink-48">
          {category.groupName}
        </span>
      )}
      {category.hidden && (
        <span className="rounded-6 bg-[#fde8eb] px-2 py-0.5 text-[11px] text-[#a3151f]">Ẩn</span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-8 border border-hairline px-3 py-1 text-[12px] text-ink hover:bg-canvas-parchment"
        >
          Sửa
        </button>
        <form
          action={deleteCategoryAction}
          onSubmit={(e) => {
            if (!confirm(`Xóa category "${category.name}"? Hành động này không thể hoàn tác.`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={category.id} />
          <button
            type="submit"
            className="rounded-8 border border-hairline px-3 py-1 text-[12px] text-[#d70015] hover:bg-canvas-parchment"
          >
            Xóa
          </button>
        </form>
      </div>
    </li>
  );
}
