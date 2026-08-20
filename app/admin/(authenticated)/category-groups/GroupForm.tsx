'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { createGroupAction, type GroupFormState } from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-hairline outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function GroupForm() {
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(
    createGroupAction,
    undefined
  );
  return (
    <form action={formAction} className="max-w-prose space-y-4 border-b border-hairline pb-6">
      <div>
        <label className={labelClass}>Tên group (VD: Company, Personal)</label>
        <input name="name" required className={inputClass} />
      </div>
      {state?.ok === false && (
        <p role="alert" className="text-[13px] text-[#d70015]">{state.error}</p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-[13px] text-primary">Đã tạo group.</p>
      )}
      <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
        {pending ? 'Đang tạo…' : 'Tạo group'}
      </Button>
    </form>
  );
}
