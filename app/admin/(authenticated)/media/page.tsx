import { requireRole } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';
import { UploadForm } from './UploadForm';
import { MediaCard } from './MediaCard';
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
            <MediaCard
              key={m.id}
              id={m.id}
              url={m.url}
              altText={m.altText}
              originalName={m.originalName}
              width={m.width}
              height={m.height}
              fileSize={m.fileSize}
              deleteAction={deleteMediaFormAction}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
