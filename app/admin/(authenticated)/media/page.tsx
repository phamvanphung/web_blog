import { requireRole } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';
import { UploadForm } from './UploadForm';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  await requireRole('ADMIN');
  const { items, total } = await listMedia({ take: 60 });

  return (
    <div>
      <h1 className="mb-2 text-3xl">Media</h1>
      <p className="mb-8 text-sm text-muted">
        Admin-only. Upload qua form dưới — Sharp tạo 4 variant WebP (original / 1600w / 800w / 400w).
      </p>

      <UploadForm />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Tất cả ({total})</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Chưa có media nào.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.altText ?? m.originalName}
                className="aspect-square w-full border border-line object-cover"
              />
              <p className="truncate text-xs text-muted">{m.originalName}</p>
              <p className="text-xs text-muted">
                {m.width}×{m.height} · {(m.fileSize / 1024).toFixed(1)} KB
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
