'use client';
import type { RawHtmlSection } from '@/modules/pages/types';

type Props = {
  section: RawHtmlSection;
  onChange: (next: RawHtmlSection) => void;
};

export function RawHtmlEditor({ section, onChange }: Props) {
  return (
    <textarea
      rows={6}
      value={section.data.html}
      onChange={(e) => onChange({ ...section, data: { html: e.target.value } })}
      placeholder="Nhập HTML thuần..."
      className="w-full rounded-8 border border-hairline bg-canvas px-3 py-2 text-[14px] font-mono leading-relaxed"
    />
  );
}
