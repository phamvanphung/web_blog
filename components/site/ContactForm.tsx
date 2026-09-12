// components/site/ContactForm.tsx
'use client';

import type { ReactNode } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitContact } from '@/modules/contact/server';

type ActionResult = { ok: boolean; error?: string; message?: string };

async function action(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const payload = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    message: String(formData.get('message') ?? '')
  };
  const res = await submitContact(payload, {
    ip: null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  });
  if (res.ok) return { ok: true, message: 'Gửi thành công. Chúng tôi sẽ phản hồi sớm.' };
  if (res.error === 'rate_limited')
    return { ok: false, error: 'Bạn gửi quá nhiều. Vui lòng thử lại sau.' };
  // Validation messages MUST contain the literal "kiểm tra" — asserted by
  // tests/e2e/public-contact.spec.ts. Do not reword.
  if (res.error === 'invalid')
    return { ok: false, error: 'Vui lòng kiểm tra các trường bắt buộc.' };
  return { ok: false, error: 'Có lỗi. Vui lòng thử lại sau.' };
}

function SubmitBtn({ className = '' }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-11 items-center justify-center rounded-pill bg-primary px-8 text-[15px] text-white transition-colors hover:bg-primary-focus disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus ${className}`}
    >
      {pending ? 'Đang gửi…' : 'Gửi'}
    </button>
  );
}

export function ContactForm({ actionSlot }: { actionSlot?: ReactNode }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false });
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Họ tên" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Điện thoại" name="phone" />
        <Field label="Chủ đề" name="subject" />
      </div>
      <Field label="Nội dung" name="message" required textarea rows={6} />
      {/* Action row: Submit + optional actionSlot share width via flex-1
          so Gửi sits in the same row as the chat buttons when both are
          configured. Status messages move to their own row below to
          avoid breaking the equal-width distribution. */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <SubmitBtn className="flex-1 sm:px-12" />
        {actionSlot}
      </div>
      {(state.ok && state.message) || (!state.ok && state.error) ? (
        <p
          role="status"
          className={`text-[13px] ${state.ok ? 'text-primary' : 'text-error'}`}
        >
          {state.ok ? state.message : state.error}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  required,
  type = 'text',
  textarea,
  rows
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] text-ink-80">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={rows}
          className="w-full rounded-11 bg-canvas-parchment px-4 py-3 text-[15px] text-ink border border-hairline outline-none focus:border-primary-focus focus:bg-canvas"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-hairline outline-none focus:border-primary-focus focus:bg-canvas"
        />
      )}
    </div>
  );
}
