'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { uploadMediaAction } from '@/modules/media/server/upload';

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setErr('Chọn 1 file ảnh trước.');
      return;
    }
    setBusy(true);
    const fd = new FormData();
    fd.set('file', file);
    const altText =
      (e.currentTarget.elements.namedItem('altText') as HTMLInputElement)?.value ?? '';
    if (altText) fd.set('altText', altText);
    const result = await uploadMediaAction(fd);
    setBusy(false);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setOk(`Đã upload (id ${result.id.slice(0, 8)}…).`);
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-prose space-y-4 border-b border-hairline pb-6">
      <div>
        <label className="mb-1 block text-[13px] text-ink-80">
          Ảnh (JPEG / PNG / WebP / GIF, ≤ 10 MB)
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="block w-full text-[13px]"
        />
      </div>
      <div>
        <label className="mb-1 block text-[13px] text-ink-80">Alt text (a11y + SEO)</label>
        <input
          name="altText"
          maxLength={255}
          className="h-11 w-full rounded-11 bg-canvas-parchment px-4 text-[15px] text-ink border border-transparent outline-none focus:border-primary-focus focus:bg-canvas"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary-pill" size="sm" disabled={busy}>
          {busy ? 'Đang upload...' : 'Upload'}
        </Button>
        {err && (
          <span role="alert" className="text-[13px] text-error">
            {err}
          </span>
        )}
        {ok && (
          <span role="status" className="text-[13px] text-primary">
            {ok}
          </span>
        )}
      </div>
    </form>
  );
}
