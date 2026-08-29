'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { updateUserAction, type UpdateUserResult } from './actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

/**
 * Client wrapper around `updateUserAction`. Same rationale as
 * `NewUserForm`: surfaces inline success/error feedback so the user
 * isn't left guessing whether the save succeeded.
 */
export function EditUserForm({
  user
}: {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'EDITOR';
    status: 'ACTIVE' | 'DISABLED';
  };
}) {
  const [result, formAction, pending] = useActionState<
    UpdateUserResult | null,
    FormData
  >(updateUserAction, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          name="email"
          defaultValue={user.email}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Tên</label>
        <input name="name" defaultValue={user.name} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Mật khẩu mới (để trống nếu giữ)</label>
        <input
          type="password"
          name="password"
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="mt-1 text-[11px] text-ink-48">
          Để trống = giữ mật khẩu cũ. Để đặt lại mật khẩu cho user, dùng nút "Reset pass" ở danh sách.
        </p>
      </div>
      <div>
        <label className={labelClass}>Role</label>
        <select name="role" defaultValue={user.role} className={inputClass}>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Trạng thái</label>
        <select name="status" defaultValue={user.status} className={inputClass}>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
        <p className="mt-1 text-[11px] text-ink-48">
          Để chuyển trạng thái nhanh, dùng nút Disable / Enable ở danh sách Users.
        </p>
      </div>
      {result && !result.ok && (
        <div
          role="alert"
          className="rounded-11 border border-hairline bg-canvas-parchment p-3 text-[13px] text-error"
        >
          {result.error}
        </div>
      )}
      <Button type="submit" variant="primary-pill" disabled={pending}>
        {pending ? 'Đang lưu…' : 'Lưu'}
      </Button>
    </form>
  );
}