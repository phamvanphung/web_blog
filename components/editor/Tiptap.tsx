'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useState } from 'react';
import { extensionBundle } from './extensions';
import { Button } from '@/components/ui/Button';

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'TRASHED' | 'PENDING' | 'SCHEDULED';

export type TiptapTaxonomy = {
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

const noopTaxonomy: TiptapTaxonomy = { categoryIds: [], tagIds: [], featuredMediaId: null };

export function Tiptap({
  initialContent,
  initialTitle = '',
  postId: initialPostId,
  initialStatus,
  onSaved
}: Props) {
  const editor = useEditor({
    extensions: extensionBundle,
    content: initialContent as never,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'prose max-w-prose focus:outline-none min-h-[300px]' } }
  });

  const [title, setTitle] = useState<string>(initialTitle);
  const [postId, setPostId] = useState<string | null>(initialPostId);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function readTaxonomy(): TiptapTaxonomy {
    if (typeof window === 'undefined') return noopTaxonomy;
    return (
      (window as unknown as { __postTaxonomy?: TiptapTaxonomy }).__postTaxonomy ?? noopTaxonomy
    );
  }

  async function saveDraft() {
    if (!editor) return;
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
          contentJson: editor.getJSON(),
          categoryIds: tax.categoryIds,
          tagIds: tax.tagIds,
          featuredMediaId: tax.featuredMediaId
        })
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

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        placeholder="Tiêu đề bài viết…"
        className="w-full border-b border-line bg-bg px-2 py-3 text-3xl font-heading focus:outline-none"
      />
      <div
        className="border border-line bg-bg px-3 py-3"
        onInput={() => setDirty(true)}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3">
        <p className="text-xs text-muted">
          {status === 'saving' && 'Đang lưu…'}
          {status === 'saved' && '✓ Đã lưu.'}
          {status === 'error' && <span className="text-red-700">✗ {error}</span>}
          {status === 'idle' && (dirty ? 'Có thay đổi chưa lưu.' : 'Chưa có thay đổi.')}
          {initialStatus && (
            <span className="ml-3">
              Trạng thái: <strong>{initialStatus}</strong>
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button onClick={saveDraft} disabled={status === 'saving'} size="sm">
            {status === 'saving' ? 'Đang lưu…' : 'Lưu nháp'}
          </Button>
        </div>
      </div>
    </div>
  );
}
