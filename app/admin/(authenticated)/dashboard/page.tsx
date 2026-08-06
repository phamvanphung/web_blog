import Link from 'next/link';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

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
  } catch (e) {
    dbDown = true;
    logger.warn('dashboard.counts_failed', {
      error: (e as Error).message.slice(0, 200)
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl">Dashboard</h1>
      <p className="mb-8 text-sm text-muted">Tổng quan nhanh.</p>

      {dbDown && (
        <div role="status" className="mb-6 border border-line bg-bg p-4 text-sm text-muted">
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

      <h2 className="mb-3 mt-10 text-lg font-semibold">Bài viết gần đây</h2>
      {recentPosts.length === 0 ? (
        <p className="text-sm text-muted">Chưa có bài viết.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {recentPosts.map((p) => (
            <li key={p.id} className="border-b border-line py-2">
              <Link
                href={`/admin/posts/${p.id}/edit`}
                className="font-ui underline hover:no-underline"
              >
                {p.title}
              </Link>
              <span className="ml-2 text-xs text-muted">
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
    <Link href={href} className="block border border-line p-4 hover:border-accent">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-sm text-muted">{sub}</div>
    </Link>
  );
}
