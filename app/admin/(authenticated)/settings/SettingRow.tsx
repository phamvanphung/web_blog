'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateSettingAction, type SettingFormState } from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';

export function SettingRow({
  keyName,
  value,
  updatedAt
}: {
  keyName: string;
  value: string;
  updatedAt: string;
}) {
  const [state, formAction, pending] = useActionState<SettingFormState | undefined, FormData>(
    updateSettingAction,
    undefined
  );

  return (
    // key={updatedAt} forces remount when the server returns a fresh updatedAt,
    // so the input's defaultValue reflects the just-saved value.
    <form
      key={updatedAt}
      action={formAction}
      className="space-y-2 border-b border-hairline pb-5"
    >
      <label
        className="block text-[12px] uppercase tracking-[0.08em] text-ink-48"
        htmlFor={`k-${keyName}`}
      >
        {keyName}
      </label>
      <input id={`k-${keyName}`} type="hidden" name="key" value={keyName} />
      <input name="value" defaultValue={value} className={inputClass} />
      <p className="text-[12px] text-ink-48">Cập nhật: {updatedAt}</p>
      {state?.ok === false && (
        <p role="alert" className="text-[12px] text-[#d70015]">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-[12px] text-primary">
          ✓ Đã lưu.
        </p>
      )}
      <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
        {pending ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </form>
  );
}
