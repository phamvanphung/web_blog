'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateSettingAction, type SettingFormState } from './actions';

export function SettingRow({
  keyName,
  value,
  updatedAt
}: {
  keyName: string;
  value: string;
  updatedAt: string; // serialised ISO string from Server Component
}) {
  const [state, formAction, pending] = useActionState<SettingFormState | undefined, FormData>(
    updateSettingAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-1 border-b border-line pb-4">
      <label className="block text-xs uppercase tracking-wider text-muted" htmlFor={`k-${keyName}`}>
        {keyName}
      </label>
      <input id={`k-${keyName}`} type="hidden" name="key" value={keyName} />
      <input
        name="value"
        defaultValue={value}
        className="w-full border border-line bg-bg px-3 py-2 text-sm"
      />
      <p className="text-xs text-muted">Cập nhật: {updatedAt}</p>
      {state?.ok === false && (
        <p role="alert" className="text-xs text-muted">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p role="status" className="text-xs text-muted">
          Đã lưu.
        </p>
      )}
      <Button disabled={pending} size="sm">
        {pending ? 'Đang lưu...' : 'Lưu'}
      </Button>
    </form>
  );
}
