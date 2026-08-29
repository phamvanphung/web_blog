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
      <h1 className="mb-2 text-d-sm">Liên hệ</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Tất cả form liên hệ từ public site sẽ xuất hiện ở đây.
      </p>

      {items.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có submission nào.</p>
      ) : (
        <ul className="grid max-w-prose gap-4">
          {items.map((c) => (
            <li
              key={c.id}
              className="space-y-3 rounded-18 border border-hairline bg-canvas-parchment p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] text-ink">
                    {c.name} ·{' '}
                    <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                      {c.email}
                    </a>
                  </p>
                  {c.phone && <p className="text-[12px] text-ink-48">ĐT: {c.phone}</p>}
                  {c.subject && <p className="text-[12px] text-ink-48">Chủ đề: {c.subject}</p>}
                  <p className="mt-1 text-[12px] text-ink-48">{c.createdAt.toISOString()}</p>
                </div>
                <span
                  className={`rounded-pill px-2 py-1 text-[12px] uppercase tracking-[0.08em] ${
                    c.status === 'NEW' ? 'bg-primary text-white' : 'bg-canvas text-ink-48'
                  }`}
                >
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[15px] text-ink-80">{c.message}</p>
              <div className="flex flex-wrap gap-3 text-[13px]">
                {c.status !== 'READ' && (
                  <form action={updateContactStatusAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="READ" />
                    <button type="submit" className="text-primary hover:underline">
                      Đánh dấu đã đọc
                    </button>
                  </form>
                )}
                {c.status !== 'ARCHIVED' && (
                  <form action={updateContactStatusAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="ARCHIVED" />
                    <button type="submit" className="text-primary hover:underline">
                      Lưu trữ
                    </button>
                  </form>
                )}
                <form action={deleteContactAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-error hover:underline">
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
