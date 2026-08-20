'use client';
import type { CtaSection } from '@/modules/pages/types';

type Props = {
  section: CtaSection;
  onChange: (next: CtaSection) => void;
};

export function CtaEditor({ section, onChange }: Props) {
  const d = section.data;
  return (
    <div className="grid gap-2">
      <input
        placeholder="Tiêu đề"
        value={d.title}
        onChange={(e) => onChange({ ...section, data: { ...d, title: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
      <input
        placeholder="Mô tả (tùy chọn)"
        value={d.body ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, body: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
      <div className="flex gap-2">
        <input
          placeholder="Primary label"
          value={d.primaryLabel}
          onChange={(e) => onChange({ ...section, data: { ...d, primaryLabel: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
        <input
          placeholder="Primary href"
          value={d.primaryHref}
          onChange={(e) => onChange({ ...section, data: { ...d, primaryHref: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Secondary label (tùy chọn)"
          value={d.secondaryLabel ?? ''}
          onChange={(e) => onChange({ ...section, data: { ...d, secondaryLabel: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
        <input
          placeholder="Secondary href (tùy chọn)"
          value={d.secondaryHref ?? ''}
          onChange={(e) => onChange({ ...section, data: { ...d, secondaryHref: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
      </div>
    </div>
  );
}
