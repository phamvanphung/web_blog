'use client';

import { useActionState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { loginAction, type LoginFormState } from './actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginFormState | undefined, FormData>(
    loginAction,
    undefined
  );

  return (
    <Container width="narrow" className="py-24">
      <h1 className="mb-2 text-3xl">Đăng nhập</h1>
      <p className="mb-8 text-sm text-muted">CMS nội bộ 9ent — chỉ dành cho Admin / Editor.</p>

      <form action={formAction} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Mật khẩu</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          />
        </label>

        {state?.error && (
          <div role="alert" className="border border-line bg-bg p-3 text-sm text-muted">
            {state.error}
          </div>
        )}

        <Button disabled={pending}>{pending ? 'Đang đăng nhập...' : 'Đăng nhập'}</Button>
      </form>
    </Container>
  );
}
