'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { loginAction, type LoginFormState } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginFormState | undefined, FormData>(
    loginAction,
    undefined
  );

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-parchment px-4 py-12">
      <div className="w-full max-w-[380px] rounded-18 bg-canvas p-10">
        {/* h1 stays "Đăng nhập" — asserted by tests/e2e/auth.spec.ts */}
        <h1 className="text-d-sm">Đăng nhập</h1>
        <p className="mt-2 text-[13px] text-ink-48">
          CMS nội bộ 9ent — chỉ dành cho Admin / Editor.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-1 block text-[13px] text-ink-80">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[13px] text-ink-80">Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
            />
          </label>

          {state?.error && (
            <div
              role="alert"
              className="rounded-11 bg-canvas-parchment p-3 text-[13px] text-[#d70015]"
            >
              {state.error}
            </div>
          )}

          <Button type="submit" variant="primary-pill" disabled={pending}>
            {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  );
}
