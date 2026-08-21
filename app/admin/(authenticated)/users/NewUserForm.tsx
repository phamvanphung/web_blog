'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  createUserAction,
  type CreateUserResult
} from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

/**
 * Client wrapper around `createUserAction` that surfaces inline
 * success/error feedback. The underlying action still ends with
 * `redirect('/admin/users')` on success, so we render `pending` while the
 * server works and let navigation happen — but on failure we render
 * the message and stay on the page.
 *
 * This addresses the original bug report ("không thể tạo user"): the
 * previous form used a bare `action={createUserAction}` which gave no
 * feedback when the server rejected (e.g. duplicate email). After this
 * wrapper, every failure mode renders an explicit message.
 */
export function NewUserForm() {
  const [result, formAction, pending] = useActionState<
    CreateUserResult | null,
    FormData
  >(createUserAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" name="email" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Tên *</label>
        <input name="name" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Mật khẩu (≥ 8 ký tự) *</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Role *</label>
        <select name="role" defaultValue="EDITOR" className={inputClass}>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
        </select>
      </div>
      {result && !result.ok && (
        <div
          role="alert"
          className="rounded-11 border border-hairline bg-canvas-parchment p-3 text-[13px] text-[#d70015]"
        >
          {result.error}
        </div>
      )}
      <Button type="submit" variant="primary-pill" disabled={pending}>
        {pending ? 'Đang tạo…' : 'Tạo'}
      </Button>
    </form>
  );
}