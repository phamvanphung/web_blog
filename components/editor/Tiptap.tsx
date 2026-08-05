'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { extensionBundle } from './extensions';

type Props = {
  initialContent: unknown;
  postId: string | null;
  onSaved?: () => void;
};

export function Tiptap({ initialContent, postId: initialPostId, onSaved }: Props) {
  const editor = useEditor({
    extensions: extensionBundle,
    content: initialContent as never,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'prose max-w-prose focus:outline-none min-h-[300px]' } }
  });

  const [title, setTitle] = useState<string>('');
  const [postId, setPostId] = useState<string | null>(initialPostId);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void doSave();
      }, 1500);
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  async function doSave() {
    if (!editor) return;
    setStatus('saving');
    try {
      const res = await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          title,
          contentJson: editor.getJSON()
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      // After first save, we get an `id` back — track it for subsequent saves.
      if (!postId && body.id) setPostId(body.id);
      setStatus('saved');
      onSaved?.();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề bài viết…"
        className="w-full border-b border-line bg-bg px-2 py-3 text-3xl font-heading focus:outline-none"
      />
      <div className="border border-line bg-bg px-3 py-3">
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-muted">
        {status === 'saving' && 'Đang lưu…'}
        {status === 'saved' && 'Đã lưu nháp tự động.'}
        {status === 'error' && 'Lỗi autosave — thử Save thủ công.'}
        {status === 'idle' && 'Autosave mỗi 1.5s sau khi ngừng gõ.'}
      </p>
    </div>
  );
}
