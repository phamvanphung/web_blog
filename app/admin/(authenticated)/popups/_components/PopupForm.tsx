'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  createPopupAction,
  updatePopupAction,
  type PopupFormState
} from '../actions';

const inputClass =
  'h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-hairline outline-none focus:border-primary-focus focus:bg-canvas';
const labelClass = 'mb-1 block text-[13px] text-ink-80';
const radioClass = 'mr-2 align-middle';

type Initial = {
  id?: string;
  name?: string;
  htmlContent?: string;
  triggerType?: 'ALL' | 'HOMEPAGE' | 'PATH';
  triggerPaths?: string[];
  frequency?: 'ALWAYS' | 'ONCE';
  delaySeconds?: number;
  status?: 'DRAFT' | 'PUBLISHED';
  notes?: string | null;
};

export function PopupForm({ initial }: { initial?: Initial }) {
  const isEdit = Boolean(initial?.id);
  const action = isEdit
    ? updatePopupAction.bind(null, initial!.id!)
    : createPopupAction;

  const [state, formAction, pending] = useActionState<PopupFormState, FormData>(
    action as never,
    undefined
  );

  const [triggerType, setTriggerType] = useState<'ALL' | 'HOMEPAGE' | 'PATH'>(
    initial?.triggerType ?? 'ALL'
  );

  return (
    <form action={formAction} className="max-w-prose space-y-4 border-b border-hairline pb-6">
      <div>
        <label className={labelClass}>Tên (label nội bộ)</label>
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={initial?.name ?? ''}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Nội dung HTML+CSS+JS</label>
        <textarea
          name="htmlContent"
          required
          rows={20}
          defaultValue={initial?.htmlContent ?? ''}
          className={`${inputClass} font-mono`}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Trigger</legend>
        <label className="block text-[13px]">
          <input
            type="radio"
            name="triggerType"
            value="ALL"
            checked={triggerType === 'ALL'}
            onChange={() => setTriggerType('ALL')}
            className={radioClass}
          />
          Tất cả các trang
        </label>
        <label className="block text-[13px]">
          <input
            type="radio"
            name="triggerType"
            value="HOMEPAGE"
            checked={triggerType === 'HOMEPAGE'}
            onChange={() => setTriggerType('HOMEPAGE')}
            className={radioClass}
          />
          Chỉ trang chủ (/)
        </label>
        <label className="block text-[13px]">
          <input
            type="radio"
            name="triggerType"
            value="PATH"
            checked={triggerType === 'PATH'}
            onChange={() => setTriggerType('PATH')}
            className={radioClass}
          />
          Theo đường dẫn cụ thể
        </label>
        {triggerType === 'PATH' && (
          <div className="mt-2">
            <label className={labelClass}>Đường dẫn (mỗi dòng 1 path, bắt đầu bằng /)</label>
            <textarea
              name="triggerPaths"
              rows={4}
              placeholder={'/about\n/contact'}
              defaultValue={(initial?.triggerPaths ?? []).join('\n')}
              className={`${inputClass} font-mono`}
            />
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Tần suất</legend>
        <label className="mr-4 block text-[13px]">
          <input
            type="radio"
            name="frequency"
            value="ALWAYS"
            defaultChecked={initial?.frequency !== 'ONCE'}
            className={radioClass}
          />
          Luôn luôn (mỗi lần vào)
        </label>
        <label className="block text-[13px]">
          <input
            type="radio"
            name="frequency"
            value="ONCE"
            defaultChecked={initial?.frequency === 'ONCE'}
            className={radioClass}
          />
          Chỉ 1 lần / browser (lưu localStorage)
        </label>
      </fieldset>

      <div>
        <label className={labelClass}>Delay (giây, 0–300)</label>
        <input
          name="delaySeconds"
          type="number"
          min={0}
          max={300}
          defaultValue={initial?.delaySeconds ?? 0}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Trạng thái</label>
        <select
          name="status"
          defaultValue={initial?.status ?? 'DRAFT'}
          className={inputClass}
        >
          <option value="DRAFT">Nháp</option>
          <option value="PUBLISHED">Đã xuất bản</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Ghi chú nội bộ (tùy chọn)</label>
        <input
          name="notes"
          maxLength={500}
          defaultValue={initial?.notes ?? ''}
          className={inputClass}
        />
      </div>

      {state?.ok === false && (
        <p role="alert" className="text-[13px] text-[#d70015]">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary-pill" size="sm" disabled={pending}>
        {pending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo popup'}
      </Button>
    </form>
  );
}