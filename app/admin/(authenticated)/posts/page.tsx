import { requireRole } from '@/lib/auth';
import { listPosts } from '@/modules/posts/server';
import { deletePost } from '@/modules/posts/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/ButtonLink';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  SCHEDULED: 'Đã lên lịch',
  PUBLISHED: 'Đã xuất bản',
  HIDDEN: 'Đã ẩn',
  TRASHED: 'Thùng rác'
};

async function deleteAction(formData: FormData) {
  'use server';
  await requireRole('ADMIN');
  const id = String(formData.get('id') ?? '');
  await deletePost(id);
  revalidatePath('/admin/posts');
}

export default async function PostsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole('ADMIN');
  const sp = await searchParams;
  const validStatuses = [
    'DRAFT',
    'PENDING',
    'SCHEDULED',
    'PUBLISHED',
    'HIDDEN',
    'TRASHED'
  ] as const;
  type PostStatus = (typeof validStatuses)[number];
  const status: PostStatus | undefined =
    sp.status && (validStatuses as readonly string[]).includes(sp.status)
      ? (sp.status as PostStatus)
      : undefined;
  const posts = await listPosts({
    ...(status ? { status } : {}),
    take: 50
  });

  const filterClass = (active: boolean) =>
    `rounded-pill px-3 py-1 text-[12px] transition-colors ${
      active
        ? 'bg-ink text-white'
        : 'bg-canvas-parchment text-ink hover:bg-chip'
    }`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-d-sm">Bài viết</h1>
        <ButtonLink href="/admin/posts/new" variant="primary-pill" size="sm">
          + Viết bài mới
        </ButtonLink>
      </div>
      <p className="mb-6 text-[13px] text-ink-48">Admin-only. Click Sửa để mở editor.</p>

      <nav className="mb-6 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/posts" className={filterClass(!status)}>
          Tất cả
        </Link>
        <Link
          href="/admin/posts?status=PUBLISHED"
          className={filterClass(status === 'PUBLISHED')}
        >
          Đã xuất bản
        </Link>
        <Link
          href="/admin/posts?status=DRAFT"
          className={filterClass(status === 'DRAFT')}
        >
          Nháp
        </Link>
        <Link
          href="/admin/posts?status=TRASHED"
          className={filterClass(status === 'TRASHED')}
        >
          Thùng rác
        </Link>
      </nav>

      {posts.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có bài viết.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-[0.08em] text-ink-48">
              <th className="py-3">Tiêu đề</th>
              <th className="py-3">Trạng thái</th>
              <th className="py-3">Cập nhật</th>
              <th className="py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-hairline hover:bg-canvas-parchment">
                <td className="py-3 text-ink">{p.title}</td>
                <td className="py-3 text-ink-80">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="py-3 text-[12px] text-ink-48">{p.updatedAt.toISOString()}</td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="text-primary hover:underline"
                    >
                      Sửa
                    </Link>
                    {p.status !== 'TRASHED' && (
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-error hover:underline"
                        >
                          Xóa
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
