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
  if (res.error === 'invalid') return { ok: false, error: 'Vui lòng kiểm tra các trường bắt buộc.' };
  return { ok: false, error: 'Có lỗi. Vui lòng thử lại sau.' };
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-line bg-fg px-5 py-2 text-sm text-bg disabled:opacity-50"
    >
      {pending ? 'Đang gửi…' : 'Gửi'}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false });
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Họ tên" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Điện thoại" name="phone" />
        <Field label="Chủ đề" name="subject" />
      </div>
      <Field label="Nội dung" name="message" required textarea rows={6} />
      <SubmitBtn />
      {state.ok && state.message && (
        <p className="text-sm text-accent">{state.message}</p>
      )}
      {!state.ok && state.error && <p className="text-sm text-red-700">{state.error}</p>}
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
      <label className="mb-1 block text-sm">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={rows}
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
