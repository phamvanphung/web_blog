'use client';

import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
};

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function VideoInsertModal({ open, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  // Reset URL state when modal closes
  useEffect(() => {
    if (!open) {
      setUrl('');
      setError('');
    }
  }, [open]);

  function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidHttpUrl(trimmed)) {
      setError('Chỉ hỗ trợ URL http(s).');
      return;
    }
    setError('');
    onSubmit(trimmed);
    setUrl('');
    onClose();
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chèn video"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-18 border border-hairline bg-canvas p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-d-sm">Chèn video</h2>
        <p className="mb-3 text-[13px] text-ink-48">
          Dán URL YouTube hoặc Vimeo. Hỗ trợ cả dạng youtube.com/watch và youtu.be/.
        </p>
        <input
          autoFocus
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="https://www.youtube.com/watch?v=…"
          className="w-full rounded-8 border border-hairline bg-canvas-parchment px-3 py-2 text-[14px] focus:border-primary focus:outline-none"
        />
        {error && (
          <p className="mt-1.5 text-[13px] text-red-500">{error}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-8 px-3 py-1.5 text-[14px] text-ink-80 hover:bg-canvas-parchment"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={!url.trim()}
            onClick={handleSubmit}
            className="rounded-8 bg-primary px-3 py-1.5 text-[14px] text-white disabled:opacity-50"
          >
            Chèn
          </button>
        </div>
      </div>
    </div>
  );
}
