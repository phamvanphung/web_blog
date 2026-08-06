// app/admin/(authenticated)/audit-log/page.tsx
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { listAuditEntries } from '@/modules/audit/server/list';
import { parsePage } from '@/lib/pagination';
import { Pagination } from '@/components/site/Pagination';
import { Button } from '@/components/ui/Button';
import { purgeOldAction } from './actions';

export const dynamic = 'force-dynamic';

const filterInput =
  'h-10 w-full rounded-8 bg-canvas-parchment px-3 text-[13px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';

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
          <h1 className="mb-2 text-d-sm">Audit log</h1>
          <p className="text-[13px] text-ink-48">{total} entries.</p>
        </div>
        <form action={purgeOldAction}>
          <button type="submit" className="text-[13px] text-[#d70015] hover:underline">
            Xóa entries &gt; 90 ngày
          </button>
        </form>
      </div>

      <form className="mb-6 grid grid-cols-2 gap-3 rounded-18 border border-hairline p-5 text-[13px] md:grid-cols-6">
        <input name="action" placeholder="action" defaultValue={sp.action ?? ''} className={filterInput} />
        <input name="target" placeholder="target" defaultValue={sp.target ?? ''} className={filterInput} />
        <input name="userId" placeholder="user id" defaultValue={sp.userId ?? ''} className={filterInput} />
        <input type="date" name="from" defaultValue={sp.from ?? ''} className={filterInput} />
        <input type="date" name="to" defaultValue={sp.to ?? ''} className={filterInput} />
        <Button type="submit" variant="primary-pill" size="sm">
          Lọc
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="text-[13px] text-ink-48">Không có entries.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead className="text-left text-[12px] uppercase tracking-[0.08em] text-ink-48">
            <tr className="border-b border-hairline">
              <th className="py-3">Khi nào</th>
              <th className="py-3">Action</th>
              <th className="py-3">Target</th>
              <th className="py-3">User</th>
              <th className="py-3">IP hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-hairline hover:bg-canvas-parchment">
                <td className="py-3 font-mono text-[12px] text-ink-80">{r.createdAt.toISOString()}</td>
                <td className="py-3 font-mono text-[12px] text-ink">{r.action}</td>
                <td className="py-3 text-[12px] text-ink-80">
                  {r.target ?? '—'} <span className="text-ink-48">{r.targetId ?? ''}</span>
                </td>
                <td className="py-3 text-[12px]">
                  {r.userId ? (
                    <Link
                      href={`/admin/users/${r.userId}/edit`}
                      className="text-primary hover:underline"
                    >
                      {r.userId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-ink-48">—</span>
                  )}
                </td>
                <td className="py-3 font-mono text-[12px] text-ink-48">
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
