import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateContactStatusAction, deleteContactAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  READ: 'Đã đọc',
  ARCHIVED: 'Lưu trữ'
};

export default async function ContactsPage() {
  await requireRole('ADMIN');
  const items = await db.contactSubmission.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100
  });

  return (
    <div>
      <h1 className="mb-2 text-3xl">Liên hệ</h1>
      <p className="mb-8 text-sm text-muted">
        Admin-only. Tất cả form liên hệ từ public site sẽ xuất hiện ở đây.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Chưa có submission nào.</p>
      ) : (
        <ul className="space-y-4 max-w-prose">
          {items.map((c) => (
            <li key={c.id} className="border border-line p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-ui">
                    {c.name} · <a href={`mailto:${c.email}`}>{c.email}</a>
                  </p>
                  {c.phone && <p className="text-xs text-muted">ĐT: {c.phone}</p>}
                  {c.subject && <p className="text-xs text-muted">Chủ đề: {c.subject}</p>}
                  <p className="mt-1 text-xs text-muted">{c.createdAt.toISOString()}</p>
                </div>
                <span
                  className={`text-xs uppercase tracking-wider ${
                    c.status === 'NEW' ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
              <div className="mt-3 flex gap-2 text-xs">
                {c.status !== 'READ' && (
                  <form action={updateContactStatusAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="READ" />
                    <button type="submit" className="underline hover:no-underline">
                      Đánh dấu đã đọc
                    </button>
                  </form>
                )}
                {c.status !== 'ARCHIVED' && (
                  <form action={updateContactStatusAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <button type="submit" className="underline hover:no-underline">
                      Lưu trữ
                    </button>
                  </form>
                )}
                <form action={deleteContactAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-red-700 underline hover:no-underline"
                  >
                    Xóa
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
