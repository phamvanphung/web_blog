'use client';

import { useActionState } from 'react';
import { updateGroupAction, deleteGroupAction, type GroupFormState } from './actions';

type GroupRowProps = {
  group: {
    id: string;
    slug: string;
    name: string;
    sortOrder: number;
    isProtected: boolean;
  };
  refCount: number;
};

const inputClass =
  'rounded-8 border border-hairline bg-canvas px-2 py-1 text-[13px]';

export function GroupRow({ group, refCount }: GroupRowProps) {
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(
    updateGroupAction,
    undefined
  );
  const canDelete = !group.isProtected && refCount === 0;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-8 border border-hairline bg-canvas px-3 py-2">
      <span className="font-medium text-ink">{group.name}</span>
      <span className="text-ink-48">/{group.slug}</span>
      {group.isProtected && (
        <span className="rounded-6 bg-canvas-parchment px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-48">
          Protected
        </span>
      )}
      {refCount > 0 && (
        <span className="text-ink-48">· {refCount} category</span>
      )}

      <form action={formAction} className="ml-auto flex items-center gap-2">
        <input type="hidden" name="id" value={group.id} />
        <input
          name="name"
          defaultValue={group.name}
          className={inputClass + ' w-32'}
        />
        <input
          name="sortOrder"
          type="number"
          defaultValue={group.sortOrder}
          className={inputClass + ' w-16'}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-8 bg-primary px-3 py-1 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {pending ? '…' : 'Lưu'}
        </button>
      </form>

      {canDelete && (
        <form action={deleteGroupAction}>
          <input type="hidden" name="id" value={group.id} />
          <button
            type="submit"
            className="rounded-8 border border-hairline px-3 py-1 text-[12px] text-[#d70015] hover:bg-canvas-parchment"
          >
            Xóa
          </button>
        </form>
      )}

      {state?.ok === false && (
        <span className="basis-full text-[12px] text-[#d70015]">{state.error}</span>
      )}
    </li>
  );
}
