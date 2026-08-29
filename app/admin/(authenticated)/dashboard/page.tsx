import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let posts = 0;
  let drafts = 0;
  let published = 0;
  let users = 0;
  let media = 0;
  let contacts = 0;
  let categories = 0;
  let tags = 0;
  let recentPosts: Array<{ id: string; title: string; status: string; updatedAt: Date }> = [];
  let dbDown = false;

  try {
    const [pCount, dCount, pubCount, uCount, mCount, cCount, catCount, tagCount, recent] =
      await Promise.all([
        db.post.count(),
        db.post.count({ where: { status: 'DRAFT', deletedAt: null } }),
        db.post.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
        db.user.count(),
        db.media.count(),
        db.contactSubmission.count({ where: { status: 'NEW' } }),
        db.category.count(),
        db.tag.count(),
        db.post.findMany({
          where: { deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { id: true, title: true, status: true, updatedAt: true }
        })
      ]);
    posts = pCount;
    drafts = dCount;
    published = pubCount;
    users = uCount;
    media = mCount;
    contacts = cCount;
    categories = catCount;
    tags = tagCount;
    recentPosts = recent;
  } catch {
    dbDown = true;
    // DB unreachable: UI shows a banner via {dbDown && ...} further down.
  }

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
        <Stat label="Bài viết" sub={`${published} đã xuất bản / ${drafts} nháp`} href="/admin/posts" />
        <Stat label="Users" sub={`${users} tài khoản`} href="/admin/users" />
        <Stat label="Media" sub={`${media} ảnh`} href="/admin/media" />
        <Stat
          label="Liên hệ"
          sub={contacts > 0 ? `${contacts} mới` : 'Không có mới'}
          href="/admin/contacts"
        />
        <Stat label="Chủ đề" sub={`${categories} categories`} href="/admin/categories" />
        <Stat label="Tags" sub={`${tags} tags`} href="/admin/tags" />
        <Stat label="Menus" sub="Cấu hình nav" href="/admin/menus" />
        <Stat label="Settings" sub="Key/value" href="/admin/settings" />
      </div>

      <h2 className="mb-4 mt-12 text-[21px] font-semibold tracking-tight">Bài viết gần đây</h2>
      {recentPosts.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có bài viết.</p>
      ) : (
        <ul className="divide-y divide-hairline border-y border-hairline">
          {recentPosts.map((p) => (
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
