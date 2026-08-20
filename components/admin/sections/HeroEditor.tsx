'use client';
import type { HeroSection } from '@/modules/pages/types';

type Props = {
  section: HeroSection;
  onChange: (next: HeroSection) => void;
};

export function HeroEditor({ section, onChange }: Props) {
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
        placeholder="Phụ đề (tùy chọn)"
        value={d.subtitle ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, subtitle: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
      <div className="flex gap-2">
        <input
          placeholder="CTA label"
          value={d.ctaLabel ?? ''}
          onChange={(e) => onChange({ ...section, data: { ...d, ctaLabel: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
        <input
          placeholder="CTA href"
          value={d.ctaHref ?? ''}
          onChange={(e) => onChange({ ...section, data: { ...d, ctaHref: e.target.value } })}
          className="flex-1 rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
        />
      </div>
    </div>
  );
}
