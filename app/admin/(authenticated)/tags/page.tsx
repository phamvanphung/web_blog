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
      <h1 className="mb-2 text-3xl">Tags</h1>
      <p className="mb-8 text-sm text-muted">Admin-only. Flat danh sách, slug tự sinh.</p>

      <TagForm />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Tất cả ({tags.length})</h2>
      {tags.length === 0 ? (
        <p className="text-sm text-muted">Chưa có tag nào.</p>
      ) : (
        <ul className="space-y-1 text-sm max-w-prose">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center justify-between border-b border-line py-2">
              <span>
                <span className="font-ui">{t.name}</span>
                <span className="ml-2 text-muted">/{t.slug}</span>
              </span>
              <form action={deleteTagAction}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-xs text-muted underline hover:no-underline">
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
