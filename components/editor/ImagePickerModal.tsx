'use client';

import { useEffect, useState } from 'react';

type Media = { id: string; url: string; altText: string | null };

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

export function ImagePickerModal({ open, onClose, onSubmit }: Props) {
  const [tab, setTab] = useState<'media' | 'url'>('media');
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  // Fetch media library when modal opens on media tab
  useEffect(() => {
    if (!open || tab !== 'media') return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/media/list?take=24')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load media');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? 'Unknown error');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUrl('');
      setSelectedMediaUrl(null);
      setError(null);
    }
  }, [open]);

  function handleSubmit() {
    if (tab === 'url') {
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
    } else {
      if (!selectedMediaUrl) return;
      onSubmit(selectedMediaUrl);
      setSelectedMediaUrl(null);
      onClose();
    }
  }

  if (!open) return null;

  const canSubmit = tab === 'url' ? !!url.trim() : !!selectedMediaUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chèn ảnh"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      onClick={onClose}
    >
      <div
        className="flex w-[560px] flex-col rounded-18 border border-hairline bg-canvas shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h2 className="text-d-sm">Chèn ảnh</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-8 p-1 text-ink-48 hover:bg-canvas-parchment hover:text-ink-80"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-4 border-b border-hairline px-5">
          <button
            type="button"
            onClick={() => setTab('media')}
            className={`-mb-px border-b-2 px-3 py-2 text-[14px] transition-colors ${
              tab === 'media'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-48 hover:text-ink-80'
            }`}
          >
            Từ Media
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`-mb-px border-b-2 px-3 py-2 text-[14px] transition-colors ${
              tab === 'url'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-48 hover:text-ink-80'
            }`}
          >
            Từ URL
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px] p-5">
          {tab === 'media' && (
            <>
              {loading && (
                <div className="flex h-[260px] items-center justify-center text-ink-48">
                  Đang tải...
                </div>
              )}
              {!loading && error && (
                <div className="flex h-[260px] items-center justify-center text-red-500 text-[14px]">
                  {error}
                </div>
              )}
              {!loading && !error && items.length === 0 && (
                <div className="flex h-[260px] items-center justify-center text-ink-48 text-[14px]">
                  Chưa có ảnh nào trong thư viện.
                </div>
              )}
              {!loading && !error && items.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMediaUrl(m.url)}
                      className={`aspect-square overflow-hidden rounded-8 border-2 transition-colors ${
                        selectedMediaUrl === m.url
                          ? 'border-primary'
                          : 'border-transparent hover:border-hairline'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.url}
                        alt={m.altText ?? ''}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'url' && (
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-8 border border-hairline bg-canvas-parchment px-3 py-2 text-[14px] focus:border-primary focus:outline-none"
              />
              {error && (
                <p className="text-[13px] text-red-500">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-8 px-3 py-1.5 text-[14px] text-ink-80 hover:bg-canvas-parchment"
          >
            Huỷ
          </button>
          <button
            type="button"
            disabled={!canSubmit}
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
