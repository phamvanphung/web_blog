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

export async function createUserAction(formData: FormData): Promise<void> {
  const me = await currentAdmin();
  const parsed = CreateSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
    role: formData.get('role')
  });
  if (!parsed.success) {
    redirect('/admin/users?error=invalid');
  }
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    redirect('/admin/users?error=duplicate');
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
  redirect('/admin/users');
}

export async function updateUserAction(formData: FormData): Promise<void> {
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
    redirect(`/admin/users/${id}/edit?error=invalid`);
  }
  if (parsed.data.email) data.email = parsed.data.email;
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.password) data.passwordHash = await hashPassword(parsed.data.password);
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
