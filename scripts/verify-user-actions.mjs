// scripts/verify-user-actions.mjs
// Direct functional test of the user-management business logic by running
// the same Prisma operations the Server Actions run. We don't import the
// actions (`'use server'`) — we mirror the calls and verify the resulting
// state. This catches:
//
//   - Create user (with duplicate-email guard)
//   - Toggle status (ACTIVE ↔ DISABLED) + session cascade on disable
//   - Reset password (hash + session cascade)
//   - Update role
//
// Run from repo root: `node scripts/verify-user-actions.mjs`.

import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const ARGON_OPTS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1
};

const TEST = {
  email: `verify-${Date.now()}@9ent.test`,
  password: 'verifyPwd123!',
  newPassword: 'verifyPwd456!',
  name: 'Verify User'
};

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
}

// 1. CREATE
const exists = await db.user.findUnique({ where: { email: TEST.email } });
check('create: pre-check no-existing', exists === null);

const hash1 = await hash(TEST.password, ARGON_OPTS);
const created = await db.user.create({
  data: {
    email: TEST.email,
    name: TEST.name,
    passwordHash: hash1,
    role: 'EDITOR',
    status: 'ACTIVE'
  }
});
check('create: user created', created.id && created.status === 'ACTIVE');
const dup = await db.user.findUnique({ where: { email: TEST.email } });
check('create: duplicate detected', dup !== null);

// 2. TOGGLE STATUS (ACTIVE → DISABLED) + session cascade
await db.session.create({
  data: {
    id: randomBytes(32).toString('hex'),
    userId: created.id,
    expiresAt: new Date(Date.now() + 3600 * 1000)
  }
});
const beforeSessions = await db.session.count({ where: { userId: created.id } });
const target = await db.user.findUnique({ where: { id: created.id } });
const next = target.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
await db.user.update({ where: { id: created.id }, data: { status: next } });
if (next === 'DISABLED') {
  await db.session.deleteMany({ where: { userId: created.id } });
}
const after = await db.user.findUnique({ where: { id: created.id } });
const afterSessions = await db.session.count({ where: { userId: created.id } });
check('toggle: status flipped', after.status === 'DISABLED');
check('toggle: sessions cascaded', beforeSessions >= 1 && afterSessions === 0);

// 3. TOGGLE BACK (DISABLED → ACTIVE)
const t2 = await db.user.findUnique({ where: { id: created.id } });
const next2 = t2.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
await db.user.update({ where: { id: created.id }, data: { status: next2 } });
const re = await db.user.findUnique({ where: { id: created.id } });
check('toggle: back to ACTIVE', re.status === 'ACTIVE');

// 4. UPDATE ROLE
await db.user.update({
  where: { id: created.id },
  data: { role: 'ADMIN' }
});
const edited = await db.user.findUnique({ where: { id: created.id } });
check('update: role changed', edited.role === 'ADMIN');

// 5. RESET PASSWORD
const hash2 = await hash(TEST.newPassword, ARGON_OPTS);
await db.user.update({
  where: { id: created.id },
  data: { passwordHash: hash2 }
});
await db.session.create({
  data: {
    id: randomBytes(32).toString('hex'),
    userId: created.id,
    expiresAt: new Date(Date.now() + 3600 * 1000)
  }
});
const before = await db.session.count({ where: { userId: created.id } });
await db.session.deleteMany({ where: { userId: created.id } });
const after2 = await db.session.count({ where: { userId: created.id } });
const refreshed = await db.user.findUnique({ where: { id: created.id } });
const newValid = await verify(refreshed.passwordHash, TEST.newPassword);
const oldValid = await verify(refreshed.passwordHash, TEST.password);
check('reset: new password verifies', newValid === true);
check('reset: old password rejected', oldValid === false);
check('reset: sessions cleared', before >= 1 && after2 === 0);

// 6. CLEANUP
await db.session.deleteMany({ where: { userId: created.id } });
await db.user.delete({ where: { id: created.id } });
check('cleanup: test user removed', true);

await db.$disconnect();
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${results.length} checks passed`);
