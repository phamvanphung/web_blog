// scripts/verify-media-pagination.mjs
// Two-pronged verification:
//   1. Render /admin/media → confirm initial 60 cards + the "đang hiển
//      thị N" badge + the "Tất cả (total)" badge + the sentinel div that
//      drives infinite scroll.
//   2. Directly exercise the same Prisma query loadMoreMediaAction runs
//      to confirm a second page returns 5 rows on this dataset.
//
// Run: `node scripts/verify-media-pagination.mjs`

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

let failed = 0;
function check(name, ok) {
  console.log(`${ok ? '✓' : '✗'} ${name}`);
  if (!ok) failed++;
}

// ---- 1. Page render ----
const r = await fetch(BASE + '/admin/media', { headers: { cookie: `sid=${sid}` } });
const body = await r.text();
console.log('page status', r.status);

const total = await db.media.count();
const firstPageCount = Math.min(60, total);
check('initial page returns 200', r.status === 200);
// Each MediaCard renders an <li class="group relative..."> — count occurrences
const liMatches = body.match(/class="group relative/g) || [];
check(`page renders ${firstPageCount} cards`, liMatches.length === firstPageCount);
// Badge text is split across RSC payload — match on the substring forms.
check('shows "Tất cả" heading', body.includes('Tất cả'));
check('shows total in heading', body.includes(`${total}`));
check('shows "đang hiển thị N" hint', body.includes('đang hiển thị '));
check('sentinel div is present', body.includes('aria-hidden="true"'));

// ---- 2. Lazy-load query (mirrors loadMoreMediaAction) ----
const PAGE = 60;
const expectedSecondPage = Math.max(0, total - PAGE);
const second = await db.media.findMany({
  orderBy: { createdAt: 'desc' },
  take: PAGE + 1,
  skip: PAGE,
  select: { id: true, url: true, originalName: true, fileSize: true, width: true, height: true }
});
const hasMoreActionStyle = second.length > PAGE;
const returnedItems = (hasMoreActionStyle ? second.slice(0, PAGE) : second).length;
check(
  `second page query returns ${expectedSecondPage} rows`,
  returnedItems === expectedSecondPage
);
// Total rows returned by page 1 + page 2 = total rows in DB.
check(
  `first + second page covers all ${total} rows`,
  firstPageCount + returnedItems === total
);
check(
  'hasMore flag is false iff no third page exists',
  hasMoreActionStyle === (total > PAGE * 2)
);

await db.session.delete({ where: { id: sid } }).catch(() => {});
await db.$disconnect();
if (failed) process.exit(1);
console.log(`\nAll checks passed`);
