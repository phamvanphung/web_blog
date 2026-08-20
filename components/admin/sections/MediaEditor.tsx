'use client';
import type { MediaSection } from '@/modules/pages/types';

type Props = {
  section: MediaSection;
  onChange: (next: MediaSection) => void;
};

export function MediaEditor({ section, onChange }: Props) {
  const d = section.data;
  return (
    <div className="grid gap-2">
      <input
        placeholder="Media ID"
        value={d.mediaId}
        onChange={(e) => onChange({ ...section, data: { ...d, mediaId: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
      <select
        value={d.layout}
        onChange={(e) => onChange({ ...section, data: { ...d, layout: e.target.value as 'full' | 'pair' } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      >
        <option value="full">Full width</option>
        <option value="pair">Pair</option>
      </select>
      <input
        placeholder="Caption (tùy chọn)"
        value={d.caption ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, caption: e.target.value } })}
        className="rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]"
      />
    </div>
  );
}
