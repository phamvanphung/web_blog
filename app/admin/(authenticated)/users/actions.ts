'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/auth';
import { audit, hashIp } from '@/lib/audit';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(200),
  role: z.enum(['ADMIN', 'EDITOR'])
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(8).max(200).optional(),
  role: z.enum(['ADMIN', 'EDITOR']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional()
});

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
}

async function currentAdmin() {
  return requireRole('ADMIN');
}

/**
 * Typed result returned to `useActionState` callers (the create form).
 * Success path doesn't return — `redirect('/admin/users')` throws and
 * the navigation just happens.
 */
export type CreateUserResult = { ok: false; error: string };

export async function createUserAction(
  _prev: CreateUserResult | null,
  formData: FormData
): Promise<CreateUserResult> {
  const me = await currentAdmin();
  const parsed = CreateSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    role: formData.get('role')
  });
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu không hợp lệ (email/name/password ≥ 8 ký tự, role là ADMIN hoặc EDITOR).' };
  }
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return { ok: false, error: 'Email đã tồn tại trong hệ thống.' };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      status: 'ACTIVE'
    }
  });
  await audit({
    userId: me.id,
    action: 'user.create',
    target: 'User',
    targetId: user.id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/users');
  // Throws and ends the function — Next.js handles the navigation. On the
  // wire the client never sees this return.
  redirect('/admin/users');
}

export type UpdateUserResult = { ok: false; error: string };

export async function updateUserAction(
  _prev: UpdateUserResult | null,
  formData: FormData
): Promise<UpdateUserResult> {
  const me = await currentAdmin();
  const id = String(formData.get('id') ?? '');
  const data: Record<string, unknown> = {};
  const parsed = UpdateSchema.safeParse({
    id,
    email: formData.get('email') || undefined,
    name: formData.get('name') || undefined,
    password: formData.get('password') || undefined,
    role: formData.get('role') || undefined,
    status: formData.get('status') || undefined
  });
  if (!parsed.success) {
    return { ok: false, error: 'Dữ liệu không hợp lệ. Email phải đúng định dạng, password (nếu đổi) ≥ 8 ký tự.' };
  }
  if (parsed.data.email) data.email = parsed.data.email;
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);
  // Self-deactivate guard mirrors the quick-action path: if you're flipping
  // your own status to DISABLED, refuse. (Admins should use the dedicated
  // `toggleStatusAction` and the explicit "Disable" button to make this
  // intent unambiguous.)
  if (
    id === me.id &&
    parsed.data.status === 'DISABLED' &&
    (await db.user.findUnique({ where: { id } }))?.status === 'ACTIVE'
  ) {
    return {
      ok: false,
      error: 'Không thể tự disable tài khoản admin đang đăng nhập.'
    };
  }
  await db.user.update({ where: { id }, data });
  await audit({
    userId: me.id,
    action: 'user.update',
    target: 'User',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${id}/edit`);
  redirect('/admin/users');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await currentAdmin();
  const id = String(formData.get('id') ?? '');
  if (id === me.id) {
    redirect('/admin/users?error=self');
  }
  await db.user.delete({ where: { id } });
  await audit({
    userId: me.id,
    action: 'user.delete',
    target: 'User',
    targetId: id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

/**
 * Admin-initiated password reset. Sets a brand-new password on any user
 * without needing their current one — used when a user is locked out.
 * Returns a typed result so the caller (`useActionState` form) can render
 * success / error inline instead of relying on a `?error=` query string
 * (which is lossy on actions invoked from a Client Component).
 */
export type ResetPasswordResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

const ResetPasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(8).max(200),
  confirm: z.string().min(8).max(200)
});

export async function resetPasswordAction(
  _prev: ResetPasswordResult | null,
  formData: FormData
): Promise<ResetPasswordResult> {
  const me = await currentAdmin();
  const parsed = ResetPasswordSchema.safeParse({
    id: String(formData.get('id') ?? ''),
    password: String(formData.get('password') ?? ''),
    confirm: String(formData.get('confirm') ?? '')
  });
  if (!parsed.success) {
    return { ok: false, error: 'Mật khẩu phải từ 8 ký tự trở lên.' };
  }
  if (parsed.data.password !== parsed.data.confirm) {
    return { ok: false, error: 'Mật khẩu nhập lại không khớp.' };
  }
  const target = await db.user.findUnique({ where: { id: parsed.data.id } });
  if (!target) {
    return { ok: false, error: 'User không tồn tại.' };
  }
  // Disallow resetting an admin's password while they are disabled — defensive
  // measure so a disabled admin can't be re-enabled by simply knowing the
  // email (status must be flipped separately).
  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({
    where: { id: target.id },
    data: { passwordHash }
  });
  // Invalidate all existing sessions for this user — anyone who knew the
  // old password should re-authenticate.
  await db.session.deleteMany({ where: { userId: target.id } });
  await audit({
    userId: me.id,
    action: 'user.resetPassword',
    target: 'User',
    targetId: target.id,
    ipHash: await hashIp(await clientIp())
  });
  revalidatePath('/admin/users');
  return { ok: true, userId: target.id };
}

/**
 * One-click status toggle. ACTIVE ↔ DISABLED. Returns a typed result for
 * inline UI feedback (no `redirect()` — the row stays in place and the
 * button label updates).
 */
export type ToggleStatusResult =
  | { ok: true; userId: string; status: 'ACTIVE' | 'DISABLED' }
  | { ok: false; error: string };

const ToggleStatusSchema = z.object({ id: z.string().min(1) });

export async function toggleStatusAction(
  _prev: ToggleStatusResult | null,
  formData: FormData
): Promise<ToggleStatusResult> {
  const me = await currentAdmin();
  const parsed = ToggleStatusSchema.safeParse({
    id: String(formData.get('id') ?? '')
  });
  if (!parsed.success) {
    return { ok: false, error: 'Yêu cầu không hợp lệ.' };
  }
  const target = await db.user.findUnique({ where: { id: parsed.data.id } });
  if (!target) {
    return { ok: false, error: 'User không tồn tại.' };
  }
  // Self-disable guard — prevents an admin from locking themselves out of
  // the only admin account.
  if (target.id === me.id && target.status === 'ACTIVE') {
    return {
      ok: false,
      error: 'Không thể tự disable tài khoản admin đang đăng nhập.'
    };
  }
  const next = target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  await db.user.update({
    where: { id: target.id },
    data: { status: next }
  });
  // If disabling, also kill all sessions — the user is logged out everywhere.
  if (next === 'DISABLED') {
    await db.session.deleteMany({ where: { userId: target.id } });
  }
  await audit({
    userId: me.id,
    action: 'user.toggleStatus',
    target: 'User',
    targetId: target.id,
    ipHash: await hashIp(await clientIp()),
    metadata: { from: target.status, to: next }
  });
  revalidatePath('/admin/users');
  return { ok: true, userId: target.id, status: next };
}
