'use client';

// PostsEditor — controls for the "Recent Posts" CMS block. Mirrors
// CategoryEditor's visual style and onChange pattern. `groups` is the
// same prop PageFormClient passes through (slug + name pairs from the
// admin's group dropdown). An empty `groupSlug` is the "no filter" choice.

import type { PostsLayout, PostsSection } from '@/modules/pages/types';

type Props = {
  section: PostsSection;
  onChange: (next: PostsSection) => void;
  groups: { slug: string; name: string }[];
};

const inputClass =
  'rounded-8 border border-hairline bg-canvas px-3 py-1.5 text-[14px]';

const CHECKBOX_ROW =
  'flex items-center gap-2 text-[13px] text-ink-80';

export function PostsEditor({ section, onChange, groups }: Props) {
  const d = section.data;
  const layout: PostsLayout = d.layout ?? 'list';
  const cols = d.cols ?? 3;

  return (
    <div className="grid gap-2">
      <label className="text-[12px] text-ink-48">Group (để trống = không lọc)</label>
      <select
        value={d.groupSlug ?? ''}
        onChange={(e) =>
          onChange({ ...section, data: { ...d, groupSlug: e.target.value || undefined } })
        }
        className={inputClass}
      >
        <option value="">— Tất cả —</option>
        {groups.map((g) => (
          <option key={g.slug} value={g.slug}>
            {g.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Tiêu đề section (tùy chọn)"
        value={d.heading ?? ''}
        onChange={(e) => onChange({ ...section, data: { ...d, heading: e.target.value } })}
        className={inputClass}
      />

      <div className="flex gap-2">
        <select
          value={layout}
          onChange={(e) =>
            onChange({
              ...section,
              data: { ...d, layout: e.target.value as PostsLayout }
            })
          }
          className={inputClass + ' flex-1'}
        >
          <option value="list">Danh sách</option>
          <option value="grid">Lưới</option>
        </select>
        {layout === 'grid' && (
          <select
            value={String(cols)}
            onChange={(e) =>
              onChange({
                ...section,
                data: { ...d, cols: Number(e.target.value) as 2 | 3 | 4 }
              })
            }
            className={inputClass + ' flex-1'}
          >
            <option value="2">2 cột</option>
            <option value="3">3 cột</option>
            <option value="4">4 cột</option>
          </select>
        )}
        <label className={CHECKBOX_ROW + ' shrink-0'}>
          <input
            type="number"
            min={1}
            max={48}
            value={d.limit}
            onChange={(e) =>
              onChange({
                ...section,
                data: { ...d, limit: Math.max(1, Math.min(48, Number(e.target.value) || 1)) }
              })
            }
            className={inputClass + ' w-16'}
          />
          {layout === 'grid' ? 'Tổng bài' : 'Số bài'}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
        <label className={CHECKBOX_ROW}>
          <input
            type="checkbox"
            checked={d.showImage}
            onChange={(e) =>
              onChange({ ...section, data: { ...d, showImage: e.target.checked } })
            }
          />
          Ảnh đại diện
        </label>
        <label className={CHECKBOX_ROW}>
          <input
            type="checkbox"
            checked={d.showTitle}
            onChange={(e) =>
              onChange({ ...section, data: { ...d, showTitle: e.target.checked } })
            }
          />
          Tiêu đề
        </label>
        <label className={CHECKBOX_ROW}>
          <input
            type="checkbox"
            checked={d.showExcerpt}
            onChange={(e) =>
              onChange({ ...section, data: { ...d, showExcerpt: e.target.checked } })
            }
          />
          Mô tả
        </label>
      </div>
    </div>
  );
}