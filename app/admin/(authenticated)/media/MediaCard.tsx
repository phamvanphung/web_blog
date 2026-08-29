'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// ============================================================
// MediaCard
// ============================================================
//
// Hover-driven quick actions for a single media item in the admin gallery.
// State machine:
//   idle       — thumbnail visible, overlay hidden
//   lightbox   — full-screen image viewer (rendered via portal-style fixed
//                overlay, not a real React portal — the markup is small and
//                lives at the bottom of the card subtree, escaped from the
//                grid flow via `fixed inset-0 z-50`)
//
// The card itself never leaves the grid; only the overlay mounts/unmounts.
//
// Three actions on the card:
//   1. "Xem ảnh" — opens lightbox at the original variant URL. The image
//      uses object-contain so the original dimensions display 1:1, with
//      overflow scroll if the viewport is smaller than the source pixels.
//   2. "Lấy link" — copies the absolute URL of the original variant to the
//      clipboard. The URL is `${window.location.origin}${m.url}` so the
//      pasted link opens without auth (it's served by Nginx directly from
//      /uploads/*) and is ready to embed into other sites.
//   3. "Xóa" — unchanged from before; lives outside the hover overlay so
//      the destructive action is always reachable but never accidentally
//      clicked.
//
// Copy feedback uses the button label itself — flips to "✓ Đã copy" for
// 1.5s then reverts. We avoid a tooltip layer to keep the UI tight.

type Props = {
  id: string;
  url: string; // relative or absolute URL of the `original` variant
  altText: string | null;
  originalName: string;
  width: number | null;
  height: number | null;
  fileSize: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export function MediaCard({
  id,
  url,
  altText,
  originalName,
  width,
  height,
  fileSize,
  deleteAction
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ESC closes the lightbox. Effect-scoped so it only listens while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Compute absolute URL once per render. m.url may already be absolute
  // (in tests / future S3 setups) — guard against double-prefixing.
  const absoluteUrl = useCallback((): string => {
    if (/^https?:\/\//i.test(url)) return url;
    if (typeof window === 'undefined') return url;
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }, [url]);

  const handleCopy = useCallback(async () => {
    const target = absoluteUrl();
    try {
      // Modern path. Works on HTTPS / localhost. Throws on insecure contexts.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(target);
      } else {
        // Fallback for older browsers / non-secure contexts.
        const ta = document.createElement('textarea');
        ta.value = target;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Surface failure as a momentary label flip too, with a distinct verb
      // so the user can tell "didn't work" from "worked".
      setCopied(false);
      window.alert(`Copy thất bại. Link: ${target}`);
    }
  }, [absoluteUrl]);

  return (
    <li className="group relative space-y-1">
      {/* Thumbnail wrapper — relative container for the hover overlay */}
      <div className="relative aspect-square w-full overflow-hidden rounded-11 border border-hairline">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={altText ?? originalName}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:blur-sm"
        />

        {/* Hover overlay: dim + 2 buttons. Hidden on touch devices via
            `sm:` breakpoint (no hover state). On touch, the buttons live
            permanently so they're tappable. */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 sm:flex">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-pill bg-canvas-parchment px-3 text-[13px] text-ink hover:bg-canvas"
          >
            <IconEye /> Xem ảnh
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-pill bg-primary px-3 text-[13px] text-white hover:bg-primary-focus"
          >
            <IconLink /> {copied ? '✓ Đã copy' : 'Lấy link'}
          </button>
        </div>
      </div>

      <p className="truncate text-[12px] text-ink-80">{originalName}</p>
      <p className="text-[12px] text-ink-48">
        {(width ?? 0)}×{height ?? 0} · {(fileSize / 1024).toFixed(1)} KB
      </p>

      {/* Delete form — kept outside the hover overlay. The button is the
          worst-positioned action so a stray click doesn't delete the row
          when the user just wanted to preview the image. */}
      <form action={deleteAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-[12px] text-error hover:underline">
          Xóa
        </button>
      </form>

      {open && (
        <Lightbox url={url} alt={altText ?? originalName} onClose={() => setOpen(false)} />
      )}
    </li>
  );
}

// ============================================================
// Lightbox
// ============================================================
//
// Simple full-viewport overlay. Closes on:
//   - click anywhere outside the image (the backdrop)
//   - click the X button
//   - press ESC (handled by parent effect)
//
// Image uses object-contain so it scales to fit while preserving aspect
// ratio. If the source is larger than the viewport, the page scrolls
// inside the lightbox so the user can pan around.

function Lightbox({
  url,
  alt,
  onClose
}: {
  url: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Đóng"
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-pill bg-canvas-parchment text-ink hover:bg-canvas"
      >
        <IconClose />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-8 object-contain shadow-2xl"
      />
    </div>
  );
}

// ============================================================
// Inline icons (eye / link / close)
// ============================================================
// Stroke-based, currentColor — matches the existing Icon component grammar.

function svgProps(): React.SVGProps<SVGSVGElement> {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };
}

function IconEye() {
  return (
    <svg {...svgProps()}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg {...svgProps()}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function IconClose(): ReactNode {
  return (
    <svg {...svgProps()}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
