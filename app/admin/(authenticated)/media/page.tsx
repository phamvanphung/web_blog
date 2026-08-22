import { requireRole } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';
import { UploadForm } from './UploadForm';
import { deleteMediaFormAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  await requireRole('ADMIN');
  const { items, total } = await listMedia({ take: 60 });

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Media</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Upload 1 ảnh → Sharp tạo 4 variant WebP để serve responsive
        (gốc / 1600w / 800w / 400w). Đánh đổi disk để khỏi optimize runtime.
      </p>

      <UploadForm />

      <h2 className="mb-3 mt-10 text-[21px] font-semibold tracking-tight">Tất cả ({total})</h2>
      {items.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có media nào.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.altText ?? m.originalName}
                className="aspect-square w-full rounded-11 border border-hairline object-cover"
              />
              <p className="truncate text-[12px] text-ink-80">{m.originalName}</p>
              <p className="text-[12px] text-ink-48">
                {m.width}×{m.height} · {(m.fileSize / 1024).toFixed(1)} KB
              </p>
              <form action={deleteMediaFormAction}>
                <input type="hidden" name="id" value={m.id} />
                <button type="submit" className="text-[12px] text-[#d70015] hover:underline">
                  Xóa
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
