'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { createTagAction, type TagFormState } from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function TagForm() {
  const [state, formAction, pending] = useActionState<TagFormState | undefined, FormData>(
    createTagAction,
    undefined
  );
  return (
    <form
      action={formAction}
      className="flex max-w-prose items-end gap-3 border-b border-hairline pb-6"
    >
      <div className="flex-1">
        <label className={labelClass}>Tên tag</label>
        <input name="name" required className={inputClass} />
      </div>
      <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
        {pending ? 'Đang tạo...' : 'Tạo tag'}
      </Button>
      {state?.ok === false && (
        <span role="alert" className="text-[13px] text-[#d70015]">
          {state.error}
        </span>
      )}
      {state?.ok === true && (
        <span role="status" className="text-[13px] text-primary">
          Đã tạo.
        </span>
      )}
    </form>
  );
}
