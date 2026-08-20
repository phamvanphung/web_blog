'use client';
import type { FormSection } from '@/modules/pages/types';

type Props = {
  section: FormSection;
  onChange: (next: FormSection) => void;
};

export function FormEditor({ section, onChange }: Props) {
  const d = section.data;
  return (
    <div className="grid gap-2">
      <select
        value={d.formType}
        onChange={(e) => onChange({ ...section, data: { ...d, formType: e.target.value as 'contact' | 'newsletter' } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      >
        <option value="contact">Form liên hệ</option>
        <option value="newsletter">Newsletter</option>
      </select>
      <input
        placeholder="Tiêu đề (tùy chọn)"
        value={d.heading ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, heading: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
      <input
        placeholder="Mô tả (tùy chọn)"
        value={d.body ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, body: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
    </div>
  );
}
