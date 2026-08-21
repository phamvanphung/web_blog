// scripts/verify-user-mgmt.mjs
// One-shot verification helper — creates a session row for the admin, then
// curls the protected pages to confirm the new user-management UI renders.
// Run from the repo root: `node scripts/verify-user-mgmt.mjs`.

import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const BASE = process.env.BASE_URL ?? 'http://localhost:3016';

const admin = await db.user.findUnique({ where: { email: 'admin@9ent.vn' } });
if (!admin) {
  console.error('admin@9ent.vn not found — run prisma seed first');
  process.exit(1);
}

const sid = randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
await db.session.create({
  data: { id: sid, userId: admin.id, expiresAt }
});
console.log('Created session', sid.slice(0, 12) + '…');

async function get(path) {
  const r = await fetch(BASE + path, {
    headers: { cookie: `sid=${sid}` },
    redirect: 'manual'
  });
  const body = await r.text();
  return { status: r.status, body };
}

const checks = [];

// 1. /admin/users renders the new quick actions
{
  const { status, body } = await get('/admin/users');
  const hasDisable = body.includes('>Disable<') || body.includes('>Enable<');
  const hasReset = body.includes('Reset pass');
  const hasNew = body.includes('+ Tạo user');
  const hasSelfGuard = body.includes('Không thể tự disable');
  checks.push({ path: '/admin/users', status, hasDisable, hasReset, hasNew, hasSelfGuard });
}

// 2. /admin/users/new renders the client form with useActionState bindings
{
  const { status, body } = await get('/admin/users/new');
  const hasEmail = body.includes('name="email"');
  const hasPassword = body.includes('name="password"');
  const hasRole = body.includes('name="role"');
  hasRole && checks.push({ path: '/admin/users/new', status, hasEmail, hasPassword, hasRole });
  if (!hasRole) checks.push({ path: '/admin/users/new', status, hasEmail, hasPassword, hasRole, MISSING: true });
}

// 3. /admin/users/<admin id>/edit renders the edit form
{
  const { status, body } = await get(`/admin/users/${admin.id}/edit`);
  const hasEmail = body.includes('name="email"');
  const hasRole = body.includes('name="role"');
  const hasStatus = body.includes('name="status"');
  const hasNote = body.includes('Reset pass');
  checks.push({ path: `/admin/users/${admin.id}/edit`, status, hasEmail, hasRole, hasStatus, hasNote });
}

console.log(JSON.stringify(checks, null, 2));

await db.session.delete({ where: { id: sid } }).catch(() => {});
await db.$disconnect();
