'use client';

import { useActionState, useState } from 'react';
import {
  toggleStatusAction,
  resetPasswordAction,
  type ToggleStatusResult,
  type ResetPasswordResult
} from './actions';

// Reuse the same primitive classes that `page.tsx` and the form pages
// already use, so the quick-actions blend in with the rest of the admin
// without dragging in a brand-new style grammar.
const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

/**
 * Quick-action cluster for a single row in the Users table.
 *
 * Three actions:
 *   1. Toggle ACTIVE ↔ DISABLED (one-click; no full edit form)
 *   2. Reset password (opens a collapsible inline form)
 *   3. Delete (kept inline as before — small destructive button)
 *
 * Both stateful actions return typed results instead of `redirect()`-ing,
 * so the button row stays in place and shows success/error inline via
 * `useActionState`. We deliberately avoid `redirect()` here because it
 * would scroll the user to the top of the page and lose their place in
 * a long list.
 */
export function UserRowActions({
  userId,
  status,
  isSelf
}: {
  userId: string;
  status: 'ACTIVE' | 'DISABLED';
  isSelf: boolean;
}) {
  // Toggle status — `useActionState` lets us show an inline error if the
  // server rejects (e.g. self-disable guard) and keeps the button in place.
  const [toggleState, toggleFormAction, togglePending] = useActionState<
    ToggleStatusResult | null,
    FormData
  >(toggleStatusAction, null);

  // Reset password — collapses a small form into the row.
  const [open, setOpen] = useState(false);
  const [resetState, resetFormAction, resetPending] = useActionState<
    ResetPasswordResult | null,
    FormData
  >(resetPasswordAction, null);

  // After a successful reset, collapse the form. After a successful
  // toggle, clear the open state if any (cosmetic; the row re-renders).
  if (resetState?.ok && open) {
    // schedule collapse after the render that reflects success
    queueMicrotask(() => setOpen(false));
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center justify-end gap-3">
        {/* Disable / Enable button */}
        <form action={toggleFormAction}>
          <input type="hidden" name="id" value={userId} />
          <button
            type="submit"
            disabled={togglePending}
            className={
              status === 'ACTIVE'
                ? 'text-[#d70015] hover:underline disabled:opacity-40'
                : 'text-primary hover:underline disabled:opacity-40'
            }
            title={
              isSelf && status === 'ACTIVE'
                ? 'Không thể tự disable tài khoản admin đang đăng nhập'
                : status === 'ACTIVE'
                  ? 'Vô hiệu hóa user này'
                  : 'Kích hoạt lại user này'
            }
          >
            {togglePending
              ? '…'
              : status === 'ACTIVE'
                ? 'Disable'
                : 'Enable'}
          </button>
        </form>

        {/* Reset password button — toggles the inline form */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-ink-80 hover:underline"
        >
          {open ? 'Đóng' : 'Reset pass'}
        </button>
      </div>

      {/* Inline feedback for toggle (above the reset form when both fire) */}
      {toggleState && !toggleState.ok && (
        <p role="alert" className="text-[12px] text-[#d70015]">
          {toggleState.error}
        </p>
      )}
      {toggleState?.ok && (
        <p role="status" className="text-[12px] text-primary">
          ✓ Đã chuyển sang {toggleState.status === 'ACTIVE' ? 'Active' : 'Disabled'}.
        </p>
      )}

      {/* Collapsible reset password form */}
      {open && (
        <form action={resetFormAction} className="w-72 space-y-2 rounded-8 border border-hairline bg-canvas-parchment p-3">
          <input type="hidden" name="id" value={userId} />
          <div>
            <label className={labelClass}>Mật khẩu mới (≥ 8 ký tự)</label>
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
            <label className={labelClass}>Nhập lại mật khẩu mới</label>
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {resetState && !resetState.ok && (
            <p role="alert" className="text-[12px] text-[#d70015]">
              {resetState.error}
            </p>
          )}
          {resetState?.ok && (
            <p role="status" className="text-[12px] text-primary">
              ✓ Đã reset. User cần đăng nhập lại.
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] text-ink-48 hover:underline"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={resetPending}
              className="rounded-pill bg-primary px-4 py-1.5 text-[12px] text-white hover:bg-primary-focus disabled:opacity-40"
            >
              {resetPending ? 'Đang lưu…' : 'Lưu mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}