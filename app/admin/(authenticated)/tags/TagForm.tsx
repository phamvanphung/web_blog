'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { createTagAction, type TagFormState } from './actions';

export function TagForm() {
  const [state, formAction, pending] = useActionState<TagFormState | undefined, FormData>(
    createTagAction,
    undefined
  );
  return (
    <form action={formAction} className="flex items-end gap-3 max-w-prose border-b border-line pb-6">
      <div className="flex-1">
        <label className="mb-1 block text-sm">Tên tag</label>
        <input
          name="name"
          required
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
        />
      </div>
      <Button disabled={pending} size="sm">
        {pending ? 'Đang tạo...' : 'Tạo tag'}
      </Button>
      {state?.ok === false && (
        <span role="alert" className="text-sm text-muted">{state.error}</span>
      )}
      {state?.ok === true && (
        <span role="status" className="text-sm text-muted">Đã tạo.</span>
      )}
    </form>
  );
}
