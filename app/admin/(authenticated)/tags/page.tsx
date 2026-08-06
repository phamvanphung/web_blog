import { requireRole } from '@/lib/auth';
import { listTags } from '@/modules/tags/server';
import { TagForm } from './TagForm';
import { deleteTagAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  await requireRole('ADMIN');
  const tags = await listTags();

  return (
    <div>
      <h1 className="mb-2 text-d-sm">Tags</h1>
      <p className="mb-8 text-[13px] text-ink-48">Admin-only. Flat danh sách, slug tự sinh.</p>

      <TagForm />

      <h2 className="mb-3 mt-12 text-[21px] font-semibold tracking-tight">
        Tất cả ({tags.length})
      </h2>
      {tags.length === 0 ? (
        <p className="text-[13px] text-ink-48">Chưa có tag nào.</p>
      ) : (
        <ul className="max-w-prose text-[13px]">
          {tags.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between border-b border-hairline py-2"
            >
              <span>
                <span className="text-ink">{t.name}</span>
                <span className="ml-2 text-ink-48">/{t.slug}</span>
              </span>
              <form action={deleteTagAction}>
                <input type="hidden" name="id" value={t.id} />
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
