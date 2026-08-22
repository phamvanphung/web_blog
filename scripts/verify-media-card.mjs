// scripts/verify-media-card.mjs
// Renders /admin/media as an authenticated admin, greps the HTML for the
// new hover-overlay primitives (button labels, classes, aria), and prints
// what we found.
//
// Run: `node scripts/verify-media-card.mjs`

import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const db = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const BASE = process.env.BASE_URL ?? 'http://localhost:3016';

const admin = await db.user.findUnique({ where: { email: 'admin@9ent.vn' } });
if (!admin) { console.error('admin@9ent.vn not found'); process.exit(1); }

const sid = randomBytes(32).toString('hex');
await db.session.create({
  data: { id: sid, userId: admin.id, expiresAt: new Date(Date.now() + 3600 * 1000) }
});

const r = await fetch(BASE + '/admin/media', { headers: { cookie: `sid=${sid}` } });
const body = await r.text();
console.log('status', r.status);

const checks = [
  ['Xem ảnh button', body.includes('Xem ảnh')],
  ['Lấy link button', body.includes('Lấy link')],
  ['group hover class on card', /class="group relative/.test(body)],
  ['hover overlay has hidden class', /hidden items-center justify-center/.test(body)],
  ['group-hover:blur-sm on img', /group-hover:blur-sm/.test(body)],
  ['group-hover:opacity-100 on overlay', /group-hover:opacity-100/.test(body)],
  ['delete form still present', body.includes('>Xóa<')],
  ['listMedia renders items', /<\/li>/.test(body) && body.includes('KB</p>')]
];

for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);
const failed = checks.filter(([, ok]) => !ok).length;

await db.session.delete({ where: { id: sid } }).catch(() => {});
await db.$disconnect();
if (failed) process.exit(1);
console.log(`\nAll ${checks.length} checks passed`);
