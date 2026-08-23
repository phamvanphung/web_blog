import { requireRole } from '@/lib/auth';
import { listMedia } from '@/modules/media/server';
import { UploadForm } from './UploadForm';
import { MediaGrid } from './MediaGrid';
import { deleteMediaFormAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  await requireRole('ADMIN');
  // Initial page — 60 most-recent. Older rows load lazily via the
  // `loadMoreMediaAction` server action triggered by IntersectionObserver
  // inside <MediaGrid>. Total is rendered as the count badge on the grid
  // heading so the user can tell how many are still off-screen.
  const INITIAL_PAGE = 60;
  const { items, total } = await listMedia({ take: INITIAL_PAGE });

  // Map to the same wire shape the server action returns so the client
  // component can treat SSR rows and lazily-loaded rows uniformly.
  const initialItems = items.map((m) => ({
    id: m.id,
    url: m.url,
    altText: m.altText,
    originalName: m.originalName,
    width: m.width,
    height: m.height,
    fileSize: m.fileSize,
    createdAt: m.createdAt.toISOString()
  }));

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Media</h1>
      <p className="mb-8 text-[13px] text-ink-48">
        Admin-only. Upload 1 ảnh → Sharp tạo 4 variant WebP để serve responsive
        (gốc / 1600w / 800w / 400w). Đánh đổi disk để khỏi optimize runtime.
      </p>

      <UploadForm />

      <h2 className="mb-3 mt-10 text-[21px] font-semibold tracking-tight">
        Tất cả ({total})
        <span className="ml-3 text-[12px] font-normal text-ink-48">
          đang hiển thị {items.length}
        </span>
      </h2>
      {initialItems.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có media nào.</p>
      ) : (
        <MediaGrid initialItems={initialItems} deleteAction={deleteMediaFormAction} />
      )}
    </div>
  );
}


