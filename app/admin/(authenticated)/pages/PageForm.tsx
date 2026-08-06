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

const inputClass =
  'w-full rounded-11 bg-canvas-parchment px-4 py-3 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';

export function PageForm({ mode, pageId, initial, action }: Props) {
  const [state, formAction] = useActionState<PageFormState | undefined, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-prose space-y-5 border-b border-hairline pb-6">
      {pageId && <input type="hidden" name="id" value={pageId} />}

      <div>
        <label className={labelClass}>
          Tiêu đề (đổi title sẽ tạo slug mới + redirect 301)
        </label>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ''}
          className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
        />
      </div>

      <div>
        <label className={labelClass}>Nội dung (plain text)</label>
        <textarea
          name="content"
          rows={12}
          defaultValue={initial?.content ?? ''}
          className={inputClass}
        />
      </div>

      {mode === 'edit' && (
        <div>
          <label className={labelClass}>Trạng thái</label>
          <select
            name="status"
            defaultValue={initial?.status ?? 'DRAFT'}
            className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
          >
            <option value="DRAFT">Nháp</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="HIDDEN">Đã ẩn</option>
          </select>
        </div>
      )}

      {state?.ok === false && (
        <p role="alert" className="text-[13px] text-[#d70015]">
          {state.error}
        </p>
      )}
      {state?.ok === true && mode === 'edit' && (
        <p role="status" className="text-[13px] text-primary">
          Đã lưu.
        </p>
      )}

      <Button type="submit" variant="primary-pill" size="sm">
        {mode === 'create' ? 'Tạo trang' : 'Lưu'}
      </Button>
    </form>
  );
}
