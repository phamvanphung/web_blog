import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type RecentPost = { id: string; title: string; status: string; updatedAt: Date };

type DashboardStats = {
  posts: number;
  drafts: number;
  published: number;
  users: number;
  media: number;
  contacts: number;
  categories: number;
  tags: number;
  recentPosts: RecentPost[];
};

const EMPTY_STATS: DashboardStats = {
  posts: 0,
  drafts: 0,
  published: 0,
  users: 0,
  media: 0,
  contacts: 0,
  categories: 0,
  tags: 0,
  recentPosts: []
};

export default async function DashboardPage() {
  let stats: DashboardStats | null = null;
  let dbDown = false;

  try {
    // ONE pool acquire for all 8 counts. UNION ALL beats Promise.all of
    // count() because (a) 8 SQL statements share one round-trip, (b) one
    // pool slot instead of 8 in flight, (c) each branch is independent so
    // no risk of correlated-subquery miscounts. `posts` intentionally
    // omits the soft-delete filter to match the original `db.post.count()`
    // (all rows including soft-deleted); drafts / published keep
    // `deletedAt IS NULL` to match the previous counts.
    const rows = await db.$queryRaw<Array<{ k: string; n: bigint }>>`
      SELECT 'posts' AS k, COUNT(*) AS n FROM Post
      UNION ALL
      SELECT 'drafts' AS k, COUNT(*) AS n FROM Post WHERE status = 'DRAFT'     AND deletedAt IS NULL
      UNION ALL
      SELECT 'published' AS k, COUNT(*) AS n FROM Post WHERE status = 'PUBLISHED' AND deletedAt IS NULL
      UNION ALL
      SELECT 'users' AS k, COUNT(*) AS n FROM User
      UNION ALL
      SELECT 'media' AS k, COUNT(*) AS n FROM Media
      UNION ALL
      SELECT 'contacts_new' AS k, COUNT(*) AS n FROM ContactSubmission WHERE status = 'NEW'
      UNION ALL
      SELECT 'categories' AS k, COUNT(*) AS n FROM Category
      UNION ALL
      SELECT 'tags' AS k, COUNT(*) AS n FROM Tag
    `;
    const num = (k: string) => Number(rows.find((r) => r.k === k)?.n ?? 0);

    // findMany stays separate — the row shape is different from the count
    // UNION, and merging it would complicate the SELECT.
    const recent = await db.post.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true }
    });

    stats = {
      posts: num('posts'),
      drafts: num('drafts'),
      published: num('published'),
      users: num('users'),
      media: num('media'),
      contacts: num('contacts_new'),
      categories: num('categories'),
      tags: num('tags'),
      recentPosts: recent
    };
  } catch {
    // DB unreachable: UI shows the "Database chưa kết nối" banner below.
    // `stats` stays null → EMPTY_STATS fallback (all counts render as 0,
    // recent posts list shows "Chưa có bài viết").
    dbDown = true;
  }

  const s = stats ?? EMPTY_STATS;

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Dashboard</h1>
      <p className="mb-10 text-[13px] text-ink-48">Tổng quan nhanh.</p>

      {dbDown && (
        <div
          role="status"
          className="mb-6 rounded-11 border border-hairline bg-canvas-parchment p-4 text-[13px] text-ink-48"
        >
          Database chưa kết nối. Kiểm tra <code>DATABASE_URL</code> trong <code>.env</code>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Bài viết"
          sub={`${s.published} đã xuất bản / ${s.drafts} nháp`}
          href="/admin/posts"
        />
        <Stat label="Users" sub={`${s.users} tài khoản`} href="/admin/users" />
        <Stat label="Media" sub={`${s.media} ảnh`} href="/admin/media" />
        <Stat
          label="Liên hệ"
          sub={s.contacts > 0 ? `${s.contacts} mới` : 'Không có mới'}
          href="/admin/contacts"
        />
        <Stat label="Chủ đề" sub={`${s.categories} categories`} href="/admin/categories" />
        <Stat label="Tags" sub={`${s.tags} tags`} href="/admin/tags" />
        <Stat label="Menus" sub="Cấu hình nav" href="/admin/menus" />
        <Stat label="Settings" sub="Key/value" href="/admin/settings" />
      </div>

      <h2 className="mb-4 mt-12 text-[21px] font-semibold tracking-tight">Bài viết gần đây</h2>
      {s.recentPosts.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có bài viết.</p>
      ) : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {s.recentPosts.map((p) => (
            <li key={p.id} className="py-3">
              <Link
                href={`/admin/posts/${p.id}/edit`}
                className="text-ink hover:text-primary"
              >
                {p.title}
              </Link>
              <span className="ml-2 text-[12px] text-ink-48">
                · {p.status} · {p.updatedAt.toISOString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, sub, href }: { label: string; sub: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-18 bg-canvas-parchment p-5 transition-colors hover:bg-chip"
    >
      <div className="text-[12px] uppercase tracking-[0.08em] text-ink-48">{label}</div>
      <div className="mt-1 text-[21px] font-semibold tracking-tight text-ink">{sub}</div>
    </Link>
  );
}
