import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Render at request time — Prisma requires a live MySQL connection.
// Without this directive, `pnpm build` will try to pre-render and fail
// for any contributor without local MySQL.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let posts = 0;
  let users = 0;
  let media = 0;
  let dbDown = false;

  try {
    [posts, users, media] = await Promise.all([db.post.count(), db.user.count(), db.media.count()]);
  } catch (e) {
    // DB unreachable — render zeros + a banner instead of crashing the page.
    // Common during P0 onboarding before MySQL is provisioned.
    dbDown = true;
    logger.warn('dashboard.counts_failed', {
      error: (e as Error).message.slice(0, 200)
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl">Dashboard</h1>
      <p className="mb-8 text-sm text-muted">
        Scaffolding P0 — counters chỉ để verify Prisma hoạt động.
      </p>

      {dbDown && (
        <div role="status" className="mb-6 border border-line bg-bg p-4 text-sm text-muted">
          Database chưa kết nối — counters tạm thời = 0. Kiểm tra <code>DATABASE_URL</code> trong{' '}
          <code>.env</code> và chạy <code>pnpm db:migrate &amp;&amp; pnpm db:seed</code>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card label="Bài viết" value={posts} />
        <Card label="Users" value={users} />
        <Card label="Media" value={media} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line p-6">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-3xl font-heading">{value}</div>
    </div>
  );
}
