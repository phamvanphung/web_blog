'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createPageAction, updatePageAction, type PageFormState } from './actions';
import type { Section } from '@/modules/pages/types';
import { SectionList } from '@/components/admin/SectionList';

type Props = {
  initial?: { id?: string; title?: string; status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN'; sections?: Section[] };
  groups: { slug: string; name: string }[];
};

export function PageFormClient({ initial, groups }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'HIDDEN'>(initial?.status ?? 'DRAFT');
  const [sections, setSections] = useState<Section[]>(initial?.sections ?? []);
  const isEdit = Boolean(initial?.id);

  const [state, formAction] = useFormState<PageFormState | undefined, FormData>(
    isEdit ? updatePageAction : createPageAction,
    undefined
  );

  return (
    <form action={formAction} className="max-w-prose space-y-5 border-b border-hairline pb-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="sections" value={JSON.stringify(sections)} />

      <div>
        <label className="mb-1 block text-[13px] text-ink-80">
          Tiêu đề (đổi title sẽ tạo slug mới + redirect 301)
        </label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
        />
      </div>

      <SectionList value={sections} onChange={setSections} groups={groups} />

      <div>
        <label className="mb-1 block text-[13px] text-ink-80">Trạng thái</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
        >
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="HIDDEN">Đã ẩn</option>
        </select>
      </div>

      {state?.ok === false && (
        <p role="alert" className="text-[13px] text-error">
          {state.error}
        </p>
      )}
      {state?.ok === true && isEdit && (
        <p role="status" className="text-[13px] text-primary">
          Đã lưu.
        </p>
      )}

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-8 bg-primary px-4 py-1.5 text-[14px] font-medium text-white shadow-sm transition-opacity disabled:opacity-50"
    >
      {pending ? 'Đang lưu…' : isEdit ? 'Lưu' : 'Tạo trang'}
    </button>
  );
}
