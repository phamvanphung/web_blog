'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { attemptLogin } from '@/modules/auth/server/login';

export type LoginFormState = { error?: string; code?: string };

export async function loginAction(
  _prev: LoginFormState | undefined,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
  const userAgent = h.get('user-agent') ?? null;

  const result = await attemptLogin({ email, password, ip, userAgent });
  if (!result.ok) {
    return { error: result.message, code: result.code };
  }

  // Deep-link support can be added later (e.g. `?next=/admin/posts/new`).
  // For now, successful login always lands on the dashboard.
  redirect('/admin/dashboard');
}
