import { requireRole } from '@/lib/auth';
import { listPosts } from '@/modules/posts/server';
import { deletePost } from '@/modules/posts/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="mb-2 text-3xl">Bài viết</h1>
        <Link href="/admin/posts/new">
          <Button size="sm">+ Viết bài mới</Button>
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">Admin-only. Click Sửa để mở editor.</p>

      <nav className="mb-6 flex gap-2 text-xs">
        <Link
          href="/admin/posts"
          className={`border border-line px-2 py-1 ${!status ? 'bg-line' : ''}`}
        >
          Tất cả
        </Link>
        <Link
          href="/admin/posts?status=PUBLISHED"
          className={`border border-line px-2 py-1 ${status === 'PUBLISHED' ? 'bg-line' : ''}`}
        >
          Đã xuất bản
        </Link>
        <Link
          href="/admin/posts?status=DRAFT"
          className={`border border-line px-2 py-1 ${status === 'DRAFT' ? 'bg-line' : ''}`}
        >
          Nháp
        </Link>
        <Link
          href="/admin/posts?status=TRASHED"
          className={`border border-line px-2 py-1 ${status === 'TRASHED' ? 'bg-line' : ''}`}
        >
          Thùng rác
        </Link>
      </nav>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">Chưa có bài viết.</p>
      ) : (
        <table className="w-full max-w-prose text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2">Tiêu đề</th>
              <th className="py-2">Trạng thái</th>
              <th className="py-2">Cập nhật</th>
              <th className="py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="py-2 font-ui">{p.title}</td>
                <td className="py-2">{STATUS_LABELS[p.status] ?? p.status}</td>
                <td className="py-2 text-xs text-muted">{p.updatedAt.toISOString()}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="text-xs underline hover:no-underline"
                    >
                      Sửa
                    </Link>
                    {p.status !== 'TRASHED' && (
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-700 underline hover:no-underline"
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
