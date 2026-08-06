'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { createCategoryAction, type CategoryFormState } from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function CategoryForm({ parents }: { parents: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    createCategoryAction,
    undefined
  );
  return (
    <form action={formAction} className="max-w-prose space-y-4 border-b border-hairline pb-6">
      <div>
        <label className={labelClass}>Tên</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Parent (tùy chọn)</label>
        <select
          name="parentId"
          defaultValue=""
          className={inputClass}
        >
          <option value="">— Root —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Mô tả (tùy chọn)</label>
        <textarea name="description" rows={3} className={inputClass} />
      </div>
      {state?.ok === false && (
        <p role="alert" className="text-[13px] text-[#d70015]">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-[13px] text-primary">
          Đã tạo category.
        </p>
      )}
      <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
        {pending ? 'Đang tạo...' : 'Tạo category'}
      </Button>
    </form>
  );
}
