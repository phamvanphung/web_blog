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
 *    `<head>`, `<body>`. We render it inside a wrapper `<div>` with a
 *    child `<iframe srcdoc={html}>`. The browser parses the pasted
 *    HTML as a real document, so `<link rel="stylesheet">`,
 *    `<script src="…">`, `<style>`, and inline `<script>` all work
 *    without us extracting / re-injecting anything.
 *
 *    We auto-size the wrapper's height to the inner document's
 *    scrollHeight so the iframe never develops an internal scrollbar
 *    — the parent page scrolls naturally over the iframe area, giving
 *    a single seamless scroll experience.
 *
 *    Why a wrapper div rather than sizing the iframe directly?
 *    React's style diffing removes inline `style` properties that are
 *    absent from the next render's `style` prop. If we set the
 *    iframe's height via DOM mutation but pass only `{width,
 *    border, display}` as the iframe's React `style`, React will
 *    wipe our height on the next render — back to the browser's
 *    default iframe height (150px). Setting height on a wrapper
 *    `<div>` with no React `style` prop dodges that: React never
 *    touches the wrapper's style, our DOM mutations persist, and
 *    the iframe inside inherits via `height: 100%`.
 *
 *    We measure on `load`, watch the inner body with `ResizeObserver`
 *    to catch layout shifts (images loading, fonts swapping, JS-driven
 *    layout), and also poll at 100/500/1500/3000ms after load to
 *    catch late-loading assets.
 *
 *    Height is set via direct DOM mutation on the wrapper — never
 *    through React state — so the parent tree never re-renders in
 *    response to size changes (which would retrigger the iframe's
 *    own IntersectionObservers and stick `.reveal` at opacity 0).
 *
 * 2. **Fragment** — render as-is via `dangerouslySetInnerHTML`. Note
 *    that `<script>` tags inside fragment HTML are inert by design
 *    (the innerHTML parser skips them); admin must use a full
 *    document for script support.
 */
export function RawHtmlBlock({ html }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isFullDocument(html)) return;
    const wrapper = wrapperRef.current;
    const iframe = iframeRef.current;
    if (!wrapper || !iframe) return;

    let observer: ResizeObserver | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const body = doc.body;
        const docEl = doc.documentElement;
        if (!body) return;
        // documentElement.scrollHeight is the most reliable — it
        // includes everything in the document, even content that
        // overflows <body>.
        const height = Math.max(
          docEl?.scrollHeight ?? 0,
          docEl?.offsetHeight ?? 0,
          body.scrollHeight,
          body.offsetHeight
        );
        if (height > 0) {
          wrapper.style.height = `${height}px`;
        }
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
    // Wrapper has NO React `style` prop — we control its width and
    // height imperatively via DOM mutation in the effect. React's
    // style-diffing would otherwise wipe our height on the next
    // render.
    <div ref={wrapperRef} style={{ width: '100%' }}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Embedded page"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  );
}