// app/admin/(authenticated)/audit-log/page.tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { listAuditEntries } from '@/modules/audit/server/list';
import { parsePage } from '@/lib/pagination';
import { Pagination } from '@/components/site/Pagination';
import { purgeOldAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
  searchParams
}: {
  searchParams: Promise<{
    action?: string;
    target?: string;
    userId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const filter = {
    action: sp.action || undefined,
    target: sp.target || undefined,
    userId: sp.userId || undefined,
    from: sp.from ? new Date(sp.from) : undefined,
    to: sp.to ? new Date(sp.to) : undefined
  };
  const page = parsePage(sp.page);
  const { rows, total } = await listAuditEntries(filter, { page, pageSize: 50 });
  const pageCount = Math.max(1, Math.ceil(total / 50));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-2 text-3xl">Audit log</h1>
          <p className="text-sm text-muted">{total} entries.</p>
        </div>
        <form action={purgeOldAction}>
          <button type="submit" className="text-sm underline hover:no-underline">
            Xóa entries &gt; 90 ngày
          </button>
        </form>
      </div>

      <form className="mb-6 grid grid-cols-2 gap-3 border border-line p-4 text-sm md:grid-cols-6">
        <input
          name="action"
          placeholder="action"
          defaultValue={sp.action ?? ''}
          className="border border-line bg-bg px-2 py-1"
        />
        <input
          name="target"
          placeholder="target"
          defaultValue={sp.target ?? ''}
          className="border border-line bg-bg px-2 py-1"
        />
        <input
          name="userId"
          placeholder="user id"
          defaultValue={sp.userId ?? ''}
          className="border border-line bg-bg px-2 py-1"
        />
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ''}
          className="border border-line bg-bg px-2 py-1"
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ''}
          className="border border-line bg-bg px-2 py-1"
        />
        <button type="submit" className="border border-line bg-fg px-4 py-1 text-bg">
          Lọc
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">Không có entries.</p>
      ) : (
        <table className="w-full border border-line text-sm">
          <thead className="bg-bg text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Khi nào</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">IP hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-xs">{r.createdAt.toISOString()}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                <td className="px-3 py-2 text-xs">
                  {r.target ?? '—'} <span className="text-muted">{r.targetId ?? ''}</span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.userId ? (
                    <Link
                      href={`/admin/users/${r.userId}/edit`}
                      className="underline hover:no-underline"
                    >
                      {r.userId.slice(0, 8)}…
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {r.ipHash ? r.ipHash.slice(0, 8) + '…' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(p) => {
          const q = new URLSearchParams();
          if (filter.action) q.set('action', filter.action);
          if (filter.target) q.set('target', filter.target);
          if (filter.userId) q.set('userId', filter.userId);
          if (filter.from) q.set('from', filter.from.toISOString().slice(0, 10));
          if (filter.to) q.set('to', filter.to.toISOString().slice(0, 10));
          q.set('page', String(p));
          return `/admin/audit-log?${q.toString()}`;
        }}
      />
    </div>
  );
}
