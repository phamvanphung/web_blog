'use client';

import { useState } from 'react';
import { EditorCanvas } from './EditorCanvas';

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'TRASHED' | 'PENDING' | 'SCHEDULED';

export type PostTaxonomy = {
  categoryIds: string[];
  tagIds: string[];
  featuredMediaId: string | null;
};

type Props = {
  initialContent: unknown;
  initialTitle?: string;
  postId: string | null;
  initialStatus?: PostStatus;
  onSaved?: (id: string) => void;
};

const noopTaxonomy: PostTaxonomy = { categoryIds: [], tagIds: [], featuredMediaId: null };

export function PostEditor({
  initialContent,
  initialTitle = '',
  postId: initialPostId,
  initialStatus,
  onSaved,
}: Props) {
  const [title, setTitle] = useState<string>(initialTitle);
  const [postId, setPostId] = useState<string | null>(initialPostId);
  const [content, setContent] = useState<unknown>(initialContent);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function readTaxonomy(): PostTaxonomy {
    if (typeof window === 'undefined') return noopTaxonomy;
    return (
      (window as unknown as { __postTaxonomy?: PostTaxonomy }).__postTaxonomy ?? noopTaxonomy
    );
  }

  async function saveDraft() {
    setStatus('saving');
    setError(null);
    try {
      const tax = readTaxonomy();
      const res = await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          title: title || 'Untitled',
          contentJson: content,
          categoryIds: tax.categoryIds,
          tagIds: tax.tagIds,
          featuredMediaId: tax.featuredMediaId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = await res.json();
      if (!postId && body.id) setPostId(body.id);
      setStatus('saved');
      setDirty(false);
      onSaved?.(body.id);
    } catch (e) {
      setStatus('error');
      setError((e as Error).message ?? 'Lỗi lưu');
    }
  }

  // Editor column: 1280px so the writing canvas fills the page on most viewports.
// Combined with min-h-[80vh] the empty document feels like a real page rather
// than a card. The parent layout defers the right sidebar to 2xl (1536+) so
// the editor gets the full main-column width on typical laptop screens.
  const columnClass = 'mx-auto max-w-[1280px]';

  return (
    <div className="space-y-3">
      {/* TOP TOOLBAR — status + save button moved up from the bottom so the
          primary action is reachable without scrolling. */}
      <div className={`${columnClass} flex items-center justify-between gap-3 rounded-11 border border-hairline bg-canvas px-4 py-2`}>
        <p className="flex flex-wrap items-center gap-2 text-[12px] text-ink-48">
          {status === 'saving' && 'Đang lưu…'}
          {status === 'saved' && <span className="text-[#1f7a3a]">✓ Đã lưu.</span>}
          {status === 'error' && <span className="text-[#d70015]">✗ {error}</span>}
          {status === 'idle' && (dirty ? 'Có thay đổi chưa lưu.' : 'Chưa có thay đổi.')}
          {initialStatus && (
            <>
              <span className="text-ink-30">·</span>
              <span>
                Trạng thái: <strong>{initialStatus}</strong>
              </span>
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={status === 'saving'}
            className="rounded-8 bg-primary px-4 py-1.5 text-[14px] font-medium text-white shadow-sm transition-opacity disabled:opacity-50"
          >
            {status === 'saving' ? 'Đang lưu…' : 'Lưu nháp'}
          </button>
        </div>
      </div>

      {/* TITLE — same width as the editor, sits directly above the canvas. */}
      <div className={columnClass}>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Tiêu đề bài viết…"
          className="w-full border-b border-hairline bg-transparent px-2 py-3 text-[36px] font-semibold focus:outline-none"
        />
      </div>

      {/* EDITOR — the writing area. min-h-[80vh] makes the empty canvas
          fill most of the viewport so it doesn't feel cramped. */}
      <div className={columnClass}>
        <div
          className="rounded-11 border border-hairline bg-canvas px-6 py-4 min-h-[80vh] focus:outline-none"
          onInput={() => setDirty(true)}
        >
          <EditorCanvas
            initialContent={initialContent}
            onChange={(json) => {
              setContent(json);
              setDirty(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}