'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  html: string;
};

/**
 * Detect whether the pasted markup is a full HTML document (starts with
 * `<!DOCTYPE` or `<html>`).
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
 *    `<head>`, `<body>`. We render it via `<iframe srcdoc={html}>`.
 *    The browser parses the pasted HTML as a real document, so
 *    `<link rel="stylesheet">`, `<script src="…">`, `<style>`, and
 *    inline `<script>` all work without us extracting / re-injecting
 *    anything.
 *
 *    Earlier we tried to auto-resize the iframe to body.scrollHeight
 *    via `ResizeObserver` on the inner body. That interacted badly
 *    with landing pages' own `IntersectionObserver` reveal animations:
 *    the parent React tree re-rendering on each resize seemed to
 *    retrigger the reveal animations in unwanted ways, leaving
 *    `.reveal` elements stuck at opacity 0.
 *
 *    We now only measure once on `iframe.load`. Tall content scrolls
 *    inside the iframe; short content leaves a bit of empty space.
 *    The iframe is sized correctly on first paint and stays put.
 *
 * 2. **Fragment** — render as-is via `dangerouslySetInnerHTML`. Note
 *    that `<script>` tags inside fragment HTML are inert by design
 *    (the innerHTML parser skips them); admin must use a full
 *    document for script support.
 */
export function RawHtmlBlock({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(1500);

  useEffect(() => {
    if (!isFullDocument(html)) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const measure = () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) {
          setHeight(Math.max(body.scrollHeight, body.offsetHeight));
        }
      } catch {
        // Cross-origin (shouldn't happen for srcdoc, but guard anyway).
      }
    };

    iframe.addEventListener('load', measure);
    return () => iframe.removeEventListener('load', measure);
  }, [html]);

  if (!isFullDocument(html)) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Embedded page"
      style={{ width: '100%', height, border: 'none', display: 'block' }}
    />
  );
}