// components/site/ContactForm.tsx
'use client';

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

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-pill bg-primary px-md text-[15px] text-white transition-colors hover:bg-primary-focus disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
    >
      {pending ? 'Đang gửi…' : 'Gửi'}
    </button>
  );
}

export function ContactForm() {
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
      <div className="flex items-center gap-4">
        <SubmitBtn />
        {state.ok && state.message && (
          <p className="text-[13px] text-primary">{state.message}</p>
        )}
        {!state.ok && state.error && <p className="text-[13px] text-error">{state.error}</p>}
      </div>
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
