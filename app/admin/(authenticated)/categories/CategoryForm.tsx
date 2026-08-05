'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { createCategoryAction, type CategoryFormState } from './actions';

export function CategoryForm({ parents }: { parents: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    createCategoryAction,
    undefined
  );
  return (
    <form action={formAction} className="space-y-3 max-w-prose border-b border-line pb-6">
      <div>
        <label className="mb-1 block text-sm">Tên</label>
        <input name="name" required className="w-full border border-line bg-bg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-sm">Parent (tùy chọn)</label>
        <select
          name="parentId"
          defaultValue=""
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
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
        <label className="mb-1 block text-sm">Mô tả (tùy chọn)</label>
        <textarea
          name="description"
          rows={3}
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
        />
      </div>
      {state?.ok === false && (
        <p role="alert" className="text-sm text-muted">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-sm text-muted">
          Đã tạo category.
        </p>
      )}
      <Button disabled={pending} size="sm">
        {pending ? 'Đang tạo...' : 'Tạo category'}
      </Button>
    </form>
  );
}
