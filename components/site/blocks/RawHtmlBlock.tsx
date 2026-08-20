'use client';

import { useEffect, useRef } from 'react';

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
 *    We auto-size the iframe's height to its inner body's scrollHeight
 *    so the iframe never develops an internal scrollbar — the parent
 *    page scrolls naturally over the iframe area, giving a single
 *    seamless scroll experience. Height is set via direct DOM mutation
 *    (`iframe.style.height = …`), NOT React state, so the parent tree
 *    never re-renders in response to size changes — which would
 *    otherwise retrigger the iframe's own `IntersectionObserver`s and
 *    stick `.reveal` elements at opacity 0.
 *
 *    We measure on `load`, watch the inner body with `ResizeObserver`
 *    to catch layout shifts (images loading, fonts swapping, JS-driven
 *    layout), and also poll at 100/500/1500/3000ms after load to catch
 *    late-loading assets that don't trigger ResizeObserver.
 *
 * 2. **Fragment** — render as-is via `dangerouslySetInnerHTML`. Note
 *    that `<script>` tags inside fragment HTML are inert by design
 *    (the innerHTML parser skips them); admin must use a full
 *    document for script support.
 */
export function RawHtmlBlock({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isFullDocument(html)) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const body = doc.body;
        const docEl = doc.documentElement;
        if (!body) return;
        // Use the largest of the body's and documentElement's sizes —
        // some pages grow the html element past body (e.g. when body
        // has overflow:hidden and a tall absolutely-positioned child).
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          docEl?.scrollHeight ?? 0,
          docEl?.offsetHeight ?? 0
        );
        // Direct DOM write — bypass React state to keep the parent
        // tree from re-rendering on every iframe resize.
        iframe.style.height = `${height}px`;
      } catch {
        // Cross-origin (shouldn't happen for srcdoc, but guard anyway).
      }
    };

    const setup = () => {
      measure();
      try {
        const body = iframe.contentDocument?.body;
        if (body && typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(measure);
          observer.observe(body);
        }
      } catch {
        // ignore
      }
      // Poll at milestones — images / fonts / async scripts that
      // change layout don't always trip ResizeObserver cleanly.
      [100, 500, 1500, 3000].forEach((delay) => {
        timeouts.push(setTimeout(measure, delay));
      });
    };

    iframe.addEventListener('load', setup);

    return () => {
      iframe.removeEventListener('load', setup);
      observer?.disconnect();
      timeouts.forEach(clearTimeout);
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
      // No `height` in the style object — we control it imperatively via
      // `iframe.style.height` inside the effect. Keeping it out of
      // React's style prevents the parent tree from re-rendering when
      // we adjust it (which would retrigger the iframe's own observers).
      style={{ width: '100%', border: 'none', display: 'block' }}
    />
  );
}