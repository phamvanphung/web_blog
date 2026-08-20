'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  html: string;
};

/**
 * Detect whether the pasted markup is a full HTML document (starts with
 * `<!DOCTYPE` or `<html>`). For fragments we render inline via
 * dangerouslySetInnerHTML; for full documents we use an iframe.
 */
function isFullDocument(h: string): boolean {
  const t = h.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

/**
 * Raw HTML escape hatch for Page sections. Two shapes:
 *
 * 1. **Full HTML document** — admin pastes a complete page (e.g. a
 *    Claude-generated landing page) including `<!DOCTYPE>`, `<html>`,
 *    `<head>`, `<body>`, with `<link rel="stylesheet">`, `<script
 *    src="…">` (Tailwind CDN, fonts, jQuery…), inline `<style>`, inline
 *    `<script>`.
 *
 *    The previous approach (extract `<style>` + `<script>` blocks and
 *    render them as siblings via dangerouslySetInnerHTML) silently
 *    dropped every `<link rel="stylesheet">` and every `<script
 *    src="…">` — so Tailwind / fonts / jQuery never loaded.
 *
 *    We render the whole document via `<iframe srcdoc={html}>`. The
 *    browser then parses CSS / loads stylesheets / runs scripts exactly
 *    like a real page. We auto-resize the iframe height to match the
 *    inner document body so the layout flows naturally.
 *
 * 2. **Fragment** — just a chunk of HTML. Render as-is via
 *    dangerouslySetInnerHTML. Note that `<script>` tags inside
 *    fragment HTML are inert by design (innerHTML parser skips them);
 *    the admin must use a full document for script support.
 */
export function RawHtmlBlock({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(1000);

  useEffect(() => {
    if (!isFullDocument(html)) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const measure = () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) {
          // Use the larger of scrollHeight / offsetHeight — they differ
          // depending on whether content overflows.
          setHeight(Math.max(body.scrollHeight, body.offsetHeight));
        }
      } catch {
        // Cross-origin (shouldn't happen for srcdoc, but guard anyway).
      }
    };

    iframe.addEventListener('load', measure);

    // Observe inner document size so dynamic content (lazy images,
    // animations that resize the layout) keeps the iframe matched.
    let observer: ResizeObserver | null = null;
    try {
      const body = iframe.contentDocument?.body;
      if (body && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(body);
      }
    } catch {
      // ignore
    }

    return () => {
      iframe.removeEventListener('load', measure);
      observer?.disconnect();
    };
  }, [html]);

  if (!isFullDocument(html)) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Embedded page"
      // width 100% + dynamic height gives a seamless full-bleed
      // experience inside the parent page (no double scrollbars).
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  );
}