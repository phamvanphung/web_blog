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
 *    We auto-size the wrapper's height to fit the inner document so
 *    the iframe never develops an internal scrollbar — the parent
 *    page scrolls naturally over the iframe area, giving a single
 *    seamless scroll experience.
 *
 *    Why a wrapper div rather than sizing the iframe directly?
 *    React's style diffing removes inline `style` properties that are
 *    absent from the next render's `style` prop. If we set the
 *    iframe's height via DOM mutation but pass only `{width,
 *    border, display}` as the iframe's React `style`, React wipes
 *    our height on the next render back to the browser's iframe
 *    default (150px). The wrapper has only `{width}` in its React
 *    style, so React leaves the height slot alone — our DOM mutations
 *    persist, and the iframe inside inherits via `height: 100%`.
 *
 *    Why walk the DOM to measure instead of `body.scrollHeight`?
 *    `scrollHeight` reflects only what's been laid out. Right after
 *    iframe load, the iframe viewport is tiny (browser default),
 *    which makes `100vh` in the pasted HTML small, which makes
 *    sections under the hero still unrendered, which makes
 *    `scrollHeight` artificially small. We walk every element under
 *    `<body>` and take the max `getBoundingClientRect().bottom` —
 *    that forces a synchronous layout pass, walks the whole tree,
 *    and gets the real content height regardless of viewport size.
 *
 *    We measure on `load` (deferred by 2 RAF for layout stability),
 *    watch the inner body with `ResizeObserver` to catch layout
 *    shifts, and poll at 100/300/500/1000/2000/3000/5000/8000/
 *    12000ms after load to catch late-loading assets (Unsplash
 *    images, Google Fonts, async scripts).
 *
 *    **Feedback-loop guard.** Pasting landing pages is common and
 *    they often contain `min-height: 100vh` on hero sections. If we
 *    set the wrapper to body.scrollHeight, the iframe viewport grows,
 *    100vh grows proportionally, the hero's height grows, body grows
 *    past our measurement, we measure again, set the wrapper even
 *    bigger, and so on until the layout engine caps body height at
 *    2^25 (= 33 554 432 px). Before measuring we walk every element
 *    in the inner document; anything whose computed `min-height`
 *    (or `height`) ends in `vh` we convert to a fixed `px` value
 *    pinned to the *initial* iframe viewport. That locks hero
 *    sections at their natural rendered size so subsequent viewport
 *    expansion does not feed back into body height.
 *
 *    Race condition guard: if the iframe has *already* finished
 *    loading by the time our `useEffect` runs (common in React 19
 *    dev with Strict Mode — the effect runs after commit but
 *    `iframe.load` can fire in <16 ms for a small srcdoc), the
 *    load listener we register would never fire. We also check
 *    `contentDocument.readyState === 'complete'` synchronously and
 *    call `setup()` immediately when it is, behind a `setupDone`
 *    guard so we don't run twice if `load` then fires later.
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

    let setupDone = false;
    let observer: ResizeObserver | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    /**
     * Walk every CSSStyleRule inside the iframe's stylesheets and
     * convert any `vh` length to a fixed `px` value pinned at the
     * iframe's *current* viewport height. This breaks the feedback
     * loop between iframe viewport sizing and `vh`-based layout
     * properties regardless of which property uses vh —
     * `min-height`, `height`, `padding`, `margin`, `top` / `bottom`
     * on positioned elements, even `font-size` — and regardless of
     * which class names the pasted page happens to use.
     *
     * Why CSSStyleRule.style rather than `getComputedStyle().X`?
     * Computed styles resolve viewport-relative units: at a 150 px
     * iframe viewport `100vh` is reported as `"150px"`, so a regex
     * on the resolved value never matches `vh`. CSSStyleRule.style
     * preserves the original authored text (`"100vh"`), which is
     * what we need.
     *
     * Why this matters at all: pasted landing pages routinely
     * contain `.hero { min-height: 100vh }`. If we set the wrapper
     * to body.scrollHeight, the iframe viewport grows → 100vh
     * grows → hero height grows → body.scrollHeight grows → we
     * grow the wrapper → … until Chromium caps body height at
     * 2^25 (= 33 554 432 px). Pinning every vh value at the
     * initial viewport breaks the loop: hero (or whichever element
     * used vh) settles at its initial rendered size and subsequent
     * iframe expansion doesn't feed back into body height.
     */
    const overrideVhUnits = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const win = doc.defaultView;
        if (!win) return;

        const vh = win.innerHeight;
        if (!vh || vh <= 0) return;

        /** Match a single-value declaration that is purely vh units. */
        const isPureVh = (val: string): boolean =>
          /^\s*-?[\d.]+vh\s*$/.test(val);

        /** Convert "100vh" → "150px" (using the current viewport). */
        const vhToPx = (val: string): string => {
          const num = parseFloat(val);
          return `${(num * vh) / 100}px`;
        };

        /** Recurse into a rule, recursing one level for @media / @supports. */
        const processRule = (rule: CSSRule) => {
          const cssStyle = (rule as CSSStyleRule).style;
          if (cssStyle) {
            // Iterate ALL declared properties — no hard-coded list,
            // so any future vh-based property is handled the same way.
            for (let i = 0; i < cssStyle.length; i++) {
              const prop = cssStyle.item(i);
              if (!prop) continue;
              const val = cssStyle.getPropertyValue(prop);
              if (val && isPureVh(val)) {
                cssStyle.setProperty(prop, vhToPx(val));
              }
            }
          }
          const inner = (rule as { cssRules?: CSSRuleList }).cssRules;
          if (inner) {
            for (const r of Array.from(inner)) {
              processRule(r);
            }
          }
        };

        for (const sheet of Array.from(doc.styleSheets)) {
          let rules: CSSRuleList | null = null;
          try {
            rules = sheet.cssRules;
          } catch {
            // cross-origin stylesheet — skip
            continue;
          }
          if (!rules) continue;

          for (const rule of Array.from(rules)) {
            processRule(rule);
          }
        }

        // Force a synchronous layout so subsequent measure() sees
        // the updated box sizes.
        if (doc.body) void doc.body.offsetHeight;
      } catch {
        // ignore
      }
    };

    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const body = doc.body;
        if (!body) return;

        // Walk every element under <body> and take the max bottom
        // edge. `getBoundingClientRect()` forces a synchronous layout,
        // so this gives the real rendered height even when the iframe
        // viewport is currently small (which is the case right after
        // load, before our first measurement has set the wrapper
        // height).
        let maxBottom = 0;
        const walk = (el: Element) => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > maxBottom) maxBottom = rect.bottom;
          for (const child of Array.from(el.children)) {
            walk(child);
          }
        };
        walk(body);

        if (maxBottom > 0) {
          wrapper.style.height = `${maxBottom}px`;
        }
      } catch {
        // Cross-origin (shouldn't happen for srcdoc, but guard anyway).
      }
    };

    const setup = () => {
      if (setupDone) return;
      setupDone = true;

      // Pin every vh-based declaration in the iframe's stylesheets to
      // px at the initial viewport BEFORE measuring. Without this,
      // expanding the wrapper expands the iframe viewport → 100vh
      // grows → any vh-based height grows → body height grows →
      // wrapper grows → … loops until body hits Chromium's 2^25 cap.
      // No hard-coded property list: we iterate every declared
      // property on every rule, so any future vh-using property
      // (min-height, height, padding, margin, top, font-size, …)
      // is handled the same way regardless of class names.
      overrideVhUnits();

      // Defer initial measure by 2 animation frames so the browser has
      // had time to fully lay out the iframe content.
      requestAnimationFrame(() => {
        requestAnimationFrame(measure);
      });

      try {
        const body = iframe.contentDocument?.body;
        if (body && typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(measure);
          observer.observe(body);
        }
      } catch {
        // ignore
      }

      // Aggressive polling to catch late-loading assets (Unsplash
      // images, Google Fonts) and JS-driven layout changes that
      // ResizeObserver might miss. 12s ceiling is enough for typical
      // external image loads; further changes can trigger via the
      // observer.
      [100, 300, 500, 1000, 2000, 3000, 5000, 8000, 12000].forEach((delay) => {
        timeouts.push(setTimeout(measure, delay));
      });

      // ---- In-iframe navigation ----
      //
      // Problem: when this block is rendered inside an iframe wrapper
      // (e.g. a browser preview tool that embeds localhost), every
      // `<a>` click inside the iframe triggers a normal browser
      // navigation in the iframe's own history. The outer wrapper
      // never sees the URL change, so its "Back" button takes the
      // user out of the rawhtml section entirely, and the iframe
      // ends up showing a stale page.
      //
      // Fix: intercept clicks on links inside the iframe and route
      // them through `location.replace`. Because srcdoc is same-origin
      // with the parent, `replace` performs a same-document navigation
      // — no white flash, no re-layout of the wrapper chrome, just a
      // smooth content swap. Same-origin <a> clicks (anchor jumps to
      // #ids) keep their default behaviour so in-page anchors still
      // scroll the iframe contents.
      //
      // Also listen for `popstate` so the browser's Back/Forward
      // buttons work: the iframe's history stack is preserved by
      // `replace` (each call pushes a new entry), and we re-run the
      // vh-pin + measure pipeline on the new document via the
      // iframe's existing `load` listener (which fires for every
      // `location.replace`).
      try {
        const idoc = iframe.contentDocument;
        const iwin = iframe.contentWindow;
        if (!idoc || !iwin) return;

        // Seed the iframe's history with the initial URL so that the
        // first Back press has somewhere to go (otherwise Back from
        // the very first page exits the iframe entirely).
        const initialUrl = idoc.location.href;
        if (iwin.history.state === null) {
          iwin.history.replaceState({ rawhtmlNav: true }, '', initialUrl);
        }

        const onClick = (e: MouseEvent) => {
          // Respect modifier keys — let the browser handle cmd/ctrl/
          // shift/middle-click as new-tab/window opens.
          if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
          ) {
            return;
          }
          const a = (e.target as Element | null)?.closest('a');
          if (!a) return;

          const href = a.getAttribute('href');
          if (!href || href.startsWith('javascript:')) return;

          // In-page anchors (#id) — let the browser scroll the iframe
          // and push a real history entry.
          if (href.startsWith('#')) return;

          // External links (different origin, mailto:, tel:, …) —
          // let the iframe navigate normally so the browser can open
          // them in the right way.
          let url: URL;
          try {
            url = new URL(href, idoc.baseURI);
          } catch {
            return;
          }
          if (url.origin !== iwin.location.origin) return;

          e.preventDefault();
          // `location.replace` is same-document navigation when only
          // the hash changes, but it's a full reload otherwise. The
          // iframe's `load` listener (registered above) fires for the
          // reload, re-applies the vh-pin, and re-measures.
          iwin.location.replace(url.href);
        };
        idoc.addEventListener('click', onClick, true);

        // Back / Forward inside the iframe: nothing to do — the
        // browser handles `popstate` by navigating the iframe
        // history, which already re-fires our `load` listener.
        // We only need to clean up the click listener on unmount.
        const cleanup = () => idoc.removeEventListener('click', onClick, true);
        // Stash the cleanup so the effect's return can call it.
        (iframe as unknown as { __rawhtmlCleanup?: () => void }).__rawhtmlCleanup = cleanup;
      } catch {
        // Cross-origin or detached — silently degrade.
      }
    };

    // Listen for future loads (covers the case where the iframe is
    // still loading when the effect runs).
    iframe.addEventListener('load', setup);

    // Race condition: in React 19 dev with Strict Mode the effect
    // can run after the iframe has already finished loading srcdoc.
    // The load listener above would then never fire and the wrapper
    // would stay at its default 150px height forever. Check
    // readyState synchronously and run setup now if it's already
    // complete. `setupDone` prevents a double-call if load then
    // fires later.
    try {
      if (iframe.contentDocument?.readyState === 'complete') {
        setup();
      }
    } catch {
      // ignore
    }

    return () => {
      iframe.removeEventListener('load', setup);
      observer?.disconnect();
      timeouts.forEach(clearTimeout);
      const cleanup = (iframe as unknown as { __rawhtmlCleanup?: () => void })
        .__rawhtmlCleanup;
      if (cleanup) {
        cleanup();
        delete (iframe as unknown as { __rawhtmlCleanup?: () => void }).__rawhtmlCleanup;
      }
    };
  }, [html]);

  if (!isFullDocument(html)) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    // Wrapper has NO `height` in its React style prop — we control it
    // imperatively via DOM mutation in the effect. React's style
    // diffing would otherwise wipe our height on the next render.
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