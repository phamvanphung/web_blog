'use client';
import type { CategoriesSection } from '@/modules/pages/types';

type Props = {
  section: CategoriesSection;
  onChange: (next: CategoriesSection) => void;
  groups: { slug: string; name: string }[];
};

const inputClass =
  'rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]';

export function CategoryEditor({ section, onChange, groups }: Props) {
  const d = section.data;
  return (
    <div className="grid gap-2">
      <label className="text-[12px] text-ink-48">Group</label>
      <select
        value={d.groupSlug}
        onChange={(e) => onChange({ ...section, data: { ...d, groupSlug: e.target.value } })}
        className={inputClass}
      >
        {groups.map((g) => (
          <option key={g.slug} value={g.slug}>{g.name}</option>
        ))}
      </select>

      <input
        placeholder="Tiêu đề (tùy chọn)"
        value={d.heading ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, heading: e.target.value } })}
        className={inputClass}
      />
      <textarea
        placeholder="Mô tả ngắn (tùy chọn)"
        value={d.body ?? ''}
        rows={2}
        onChange={(e) => onChange({ ...section, data: { ...d, body: e.target.value } })}
        className={inputClass}
      />

      <div className="flex gap-2">
        <select
          value={d.layout}
          onChange={(e) => onChange({
            ...section,
            data: { ...d, layout: e.target.value as 'grid-2' | 'grid-3' | 'grid-4' }
          })}
          className={inputClass + ' flex-1'}
        >
          <option value="grid-2">2 cột</option>
          <option value="grid-3">3 cột</option>
          <option value="grid-4">4 cột</option>
        </select>
        <select
          value={d.orderBy}
          onChange={(e) => onChange({
            ...section,
            data: { ...d, orderBy: e.target.value as 'sortOrder' | 'name' }
          })}
          className={inputClass + ' flex-1'}
        >
          <option value="sortOrder">Theo sortOrder</option>
          <option value="name">Theo tên A-Z</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-[12px] text-ink-48">Giới hạn</label>
        <input
          type="number"
          min={1}
          max={48}
          value={d.limit}
          onChange={(e) => onChange({
            ...section,
            data: { ...d, limit: Math.max(1, Math.min(48, Number(e.target.value) || 1)) }
          })}
          className={inputClass + ' w-20'}
        />
        <label className="flex items-center gap-2 text-[13px] text-ink-80">
          <input
            type="checkbox"
            checked={d.showAll}
            onChange={(e) => onChange({ ...section, data: { ...d, showAll: e.target.checked } })}
          />
          Hiển thị nút "Xem tất cả"
        </label>
      </div>
    </div>
  );
}
