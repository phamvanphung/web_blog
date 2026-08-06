'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import type { PageFormState } from './actions';

type Props = {
  mode: 'create' | 'edit';
  pageId?: string;
  initial?: { title: string; content: string; status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' };
  action: (prev: PageFormState | undefined, fd: FormData) => Promise<PageFormState>;
};

export function PageForm({ mode, pageId, initial, action }: Props) {
  const [state, formAction] = useActionState<PageFormState | undefined, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4 max-w-prose border-b border-line pb-6">
      {pageId && <input type="hidden" name="id" value={pageId} />}

      <div>
        <label className="mb-1 block text-sm">
          Tiêu đề (đổi title sẽ tạo slug mới + redirect 301)
        </label>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="w-full border border-line bg-bg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm">Nội dung (plain text)</label>
        <textarea
          name="content"
          rows={12}
          defaultValue={initial?.content ?? ''}
          className="w-full border border-line bg-bg px-3 py-2 text-sm font-ui"
        />
      </div>

      {mode === 'edit' && (
        <div>
          <label className="mb-1 block text-sm">Trạng thái</label>
          <select
            name="status"
            defaultValue={initial?.status ?? 'DRAFT'}
            className="w-full border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="HIDDEN">Đã ẩn</option>
          </select>
        </div>
      )}

      {state?.ok === false && (
        <p role="alert" className="text-sm text-muted">
          {state.error}
        </p>
      )}
      {state?.ok === true && mode === 'edit' && (
        <p role="status" className="text-sm text-muted">
          Đã lưu.
        </p>
      )}

      <Button type="submit" size="sm">
        {mode === 'create' ? 'Tạo trang' : 'Lưu'}
      </Button>
    </form>
  );
}
