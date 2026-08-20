'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitNewsletter, type NewsletterResult } from '@/modules/newsletter/server';

const initialState: NewsletterResult | undefined = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-8 bg-primary px-4 py-2 text-[14px] font-medium text-white transition-opacity disabled:opacity-50"
    >
      {pending ? 'Đang đăng ký…' : 'Đăng ký'}
    </button>
  );
}

export function NewsletterForm() {
  const [state, action] = useActionState(submitNewsletter, initialState);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="email@example.com"
        className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <SubmitButton />
      {state && !state.ok && state.error === 'invalid' && (
        <p className="text-[12px] text-[#d70015] sm:col-span-2">Email không hợp lệ.</p>
      )}
      {state && !state.ok && state.error === 'rate_limited' && (
        <p className="text-[12px] text-[#d70015] sm:col-span-2">
          Quá nhiều yêu cầu. Thử lại sau {state.retryAfterSec ?? 60}s.
        </p>
      )}
      {state?.ok && <p className="text-[12px] text-[#1f7a3a] sm:col-span-2">✓ Đăng ký thành công!</p>}
    </form>
  );
}
