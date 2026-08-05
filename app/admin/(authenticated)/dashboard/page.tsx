import { db } from '@/lib/db';

// Render at request time — Prisma requires a live MySQL connection.
// Without this directive, `pnpm build` will try to pre-render and fail
// for any contributor without local MySQL.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [posts, users, media] = await Promise.all([
    db.post.count(),
    db.user.count(),
    db.media.count()
  ]);

  return (
    <div>
      <h1 className="mb-2 text-3xl">Dashboard</h1>
      <p className="mb-8 text-sm text-muted">
        Scaffolding P0 — counters chỉ để verify Prisma hoạt động.
      </p>
      <div className="grid grid-cols-3 gap-6 max-w-prose">
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
