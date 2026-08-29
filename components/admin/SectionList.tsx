'use client';

import { useState, useCallback } from 'react';
import type { Section, SectionKind } from '@/modules/pages/types';
import { SECTION_KINDS } from '@/modules/pages/schema';
import { HeroEditor } from './sections/HeroEditor';
import { CtaEditor } from './sections/CtaEditor';
import { FormEditor } from './sections/FormEditor';
import { MediaEditor } from './sections/MediaEditor';
import { RichTextEditor } from './sections/RichTextEditor';
import { RawHtmlEditor } from './sections/RawHtmlEditor';
import { DividerEditor } from './sections/DividerEditor';
import { CategoryEditor } from './sections/CategoryEditor';

type Props = {
  value: Section[];
  onChange: (next: Section[]) => void;
  groups: { slug: string; name: string }[];
};

const kindLabel: Record<SectionKind, string> = {
  richtext: 'Văn bản',
  hero: 'Hero',
  cta: 'CTA',
  form: 'Form',
  media: 'Media',
  rawhtml: 'HTML thuần',
  divider: 'Phân cách',
  categories: 'Danh mục',
};

function newSectionId(): string {
  // cuid-like — sufficient for client-side identity
  return 'sec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function defaultSection(kind: SectionKind): Section {
  const id = newSectionId();
  switch (kind) {
    case 'richtext':
      return { kind: 'richtext', id, data: { json: { type: 'doc', content: [{ type: 'paragraph' }] } } };
    case 'hero':
      return { kind: 'hero', id, data: { title: 'Tiêu đề hero' } };
    case 'cta':
      return { kind: 'cta', id, data: { title: 'Sẵn sàng bắt đầu?', primaryLabel: 'Bắt đầu', primaryHref: '/lien-he' } };
    case 'form':
      return { kind: 'form', id, data: { formType: 'contact' } };
    case 'media':
      return { kind: 'media', id, data: { mediaId: 'placeholder', layout: 'full' } };
    case 'rawhtml':
      return { kind: 'rawhtml', id, data: { html: '<p>Nhập HTML…</p>' } };
    case 'divider':
      return { kind: 'divider', id, data: {} };
    case 'categories':
      return { kind: 'categories', id, data: { groupSlug: 'default', layout: 'grid-3', limit: 12, showAll: false, orderBy: 'sortOrder' } };
  }
}

export function SectionList({ value, onChange, groups }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const update = useCallback((id: string, next: Section) => {
    onChange(value.map((s) => (s.id === id ? next : s)));
  }, [value, onChange]);

  const remove = useCallback((id: string) => {
    onChange(value.filter((s) => s.id !== id));
  }, [value, onChange]);

  const add = useCallback((kind: SectionKind) => {
    onChange([...value, defaultSection(kind)]);
  }, [value, onChange]);

  const move = useCallback((from: number, to: number) => {
    const next = value.slice();
    const [moved] = next.splice(from, 1) as [Section];
    next.splice(to, 0, moved);
    onChange(next);
  }, [value, onChange]);

  function summary(s: Section): string {
    switch (s.kind) {
      case 'richtext': return 'Văn bản';
      case 'hero': return s.data.title;
      case 'cta': return s.data.title;
      case 'form': return s.data.formType === 'contact' ? 'Form liên hệ' : 'Newsletter';
      case 'media': return `Media (${s.data.layout})`;
      case 'rawhtml': return `${s.data.html.slice(0, 60)}…`;
      case 'divider': return '—';
      case 'categories': return `Danh mục (${s.data.groupSlug})`;
    }
  }

  return (
    <div className="space-y-2">
      {value.map((s, idx) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDragIndex(idx)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== idx) move(dragIndex, idx);
            setDragIndex(null);
          }}
          className="rounded-11 border border-hairline bg-canvas"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="cursor-grab text-ink-48" title="Kéo để sắp xếp">☰</span>
            <span className="rounded-6 bg-canvas-parchment px-2 py-0.5 text-[12px] font-medium text-ink-48">{kindLabel[s.kind]}</span>
            <span className="flex-1 truncate text-[13px] text-ink">{summary(s)}</span>
            <button type="button" onClick={() => setEditingId(editingId === s.id ? null : s.id)} className="text-[12px] text-primary">
              {editingId === s.id ? 'Đóng' : 'Sửa'}
            </button>
            <button type="button" onClick={() => remove(s.id)} className="text-[12px] text-error">×</button>
          </div>
          {editingId === s.id && (
            <div className="border-t border-hairline px-4 py-3">
              {s.kind === 'hero' && <HeroEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'cta' && <CtaEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'form' && <FormEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'media' && <MediaEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'richtext' && <RichTextEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'rawhtml' && <RawHtmlEditor section={s} onChange={(next) => update(s.id, next)} />}
              {s.kind === 'divider' && <DividerEditor />}
              {s.kind === 'categories' && (
                <CategoryEditor section={s} onChange={(next) => update(s.id, next)} groups={groups} />
              )}
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[12px] text-ink-48">Thêm section:</span>
        <select
          value=""
          onChange={(e) => {
            const kind = e.target.value as SectionKind;
            if (SECTION_KINDS.includes(kind)) add(kind);
            e.target.value = '';
          }}
          className="rounded-8 border border-hairline bg-canvas px-2 py-1 text-[13px]"
        >
          <option value="">— Chọn loại —</option>
          {SECTION_KINDS.map((k) => (
            <option key={k} value={k}>{kindLabel[k]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
