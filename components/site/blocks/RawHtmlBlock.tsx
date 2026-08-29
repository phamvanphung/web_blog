'use client';

import { useEffect, useRef } from 'react';
import { replaceVhUnits } from './vhPin';

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
 *    We render the iframe at `height: 100vh; position: sticky;
 *    top: 0` so it always fills the viewport as the parent page
 *    scrolls. The wrapper is sized to the inner document's height
 *    so the parent page has enough scroll length to expose every
 *    section. A two-way scroll sync keeps the iframe's internal
 *    scrollY in lock-step with the parent's — even though there are
 *    technically two scrolling containers, the user sees one
 *    continuous scroll surface.
 *
 *    Why `height: 100vh` rather than `height: 100%` of the wrapper?
 *    If the iframe's height scales with the wrapper, the iframe
 *    viewport grows to match the document height, which breaks
 *    `position: sticky` *inside* the iframe (sticky needs the
 *    iframe viewport to be smaller than the content it's scrolling).
 *    That's the failure mode the /dulichvietnam htmlraw hit: every
 *    `.stage { position: sticky }` stopped sticking once the iframe
 *    viewport equalled the body height. Pinning the iframe to a
 *    fixed `100vh` keeps the iframe viewport permanently smaller
 *    than `.journey`, so sticky stages engage correctly.
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
 *    they often contain `min-height: 100vh` on hero sections. The
 *    page that prompted this fix used `.journey { height: 3024vh }`
 *    with nested `.stage { position: sticky; height: 100vh }`. Two
 *    defenses work together:
 *
 *    (a) The iframe viewport is decoupled from wrapper height. The
 *        iframe is `height: 100vh` (= outer window's viewport, fixed
 *        at render time), not `height: 100%` of the wrapper. So even
 *        if we grew the wrapper to 27,000 px, the iframe viewport
 *        stays at 911 px — there's no way for wrapper expansion to
 *        inflate 100vh.
 *
 *    (b) We additionally walk every CSSStyleRule inside the iframe
 *        and convert any `vh` length to a fixed `px` value pinned at
 *        the *initial* iframe viewport, *before* measuring. This is
 *        belt-and-braces: even if some future change accidentally
 *        makes the iframe viewport scale with the wrapper, hero /
 *        journey / etc. sizes are already locked. We also re-pin on
 *        iframe reloads (location.replace navigation), and on outer
 *        window resize (because 100vh itself changes).
 *
 *    Race condition guard: if the iframe has *already* finished
 *    loading by the time our `useEffect` runs (common in React 19
 *    dev with Strict Mode — the effect runs after commit but
 *    `iframe.load` can fire in <16 ms for a small srcdoc), the
 *    load listener we register would never fire. We also check
 *    `contentDocument.readyState === 'complete'` synchronously and
 *    call `setup()` immediately when it is. `setup()` is idempotent —
 *    it tears down the previous setup at its start, so even if both
 *    the readyState path and the load event fire in quick succession
 *    the end state is the same as one call.
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
     *
     * The pin catches `vh` in *any* declaration value — including
     * mixed expressions like `calc(100vh - 52px)`,
     * `min(100vh, 800px)`, or even `height: calc(100vh - 4rem)`.
     * Earlier versions only matched declarations that were *purely*
     * `100vh`, which let expressions like `calc(100vh - 52px) (used
     * on the page that prompted this fix) feed the feedback loop.
     */
    const overrideVhUnits = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const win = doc.defaultView;
        if (!win) return;

        const vh = win.innerHeight;
        if (!vh || vh <= 0) return;

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
              // Cheap pre-filter so we don't allocate a new string for
              // every declaration (the common case is no `vh` at all).
              if (val && /\d+vh/.test(val)) {
                const replaced = replaceVhUnits(val, vh);
                // setProperty preserves !important; assigning via
                // `style[name] =` would silently drop the priority flag.
                const priority = cssStyle.getPropertyPriority(prop);
                cssStyle.setProperty(prop, replaced, priority);
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
          const newHeight = Math.round(maxBottom);
          const currentHeight = wrapper.style.height
            ? parseInt(wrapper.style.height, 10)
            : 0;

          if (newHeight === currentHeight) return;

          // ---- Shrink guard -----------------------------------------
          // Polling re-measurements can temporarily see a smaller
          // body height (e.g. an image failed to decode yet, a web
          // font reflowed mid-load). If we shrank the wrapper to
          // match, the outer page would re-clamp `window.scrollY`
          // to a lower max, our `outerToInner` listener would
          // scroll the iframe back, and then a moment later when
          // the asset finishes loading and the body grows again
          // the wrapper would expand but the iframe scroll would
          // stay at the now-stale lower value — making it look
          // like the user "can't reach the end" of the page even
          // though the document actually fits.
          //
          // To prevent that, treat the *highest* measured value as
          // the wrapper height and never shrink below it. We still
          // allow shrinking on a deliberate reset (window resize)
          // — see `resetMeasureFloor()` below, called from the
          // resize listener.
          if (newHeight < currentHeight && !measure.allowShrink) {
            // Raise the floor but don't shrink the wrapper.
            // (We don't update the floor to newHeight either —
            // we keep the floor at the largest-ever measurement
            // so a later bigger measurement can still grow it.)
            return;
          }
          if (newHeight > currentHeight) {
            measure.floor = newHeight;
          }
          wrapper.style.height = `${newHeight}px`;
        }
      } catch {
        // Cross-origin (shouldn't happen for srcdoc, but guard anyway).
      }
    };
    // Tracks the highest measured body height. `measure` only ever
    // grows the wrapper up to this value; `resetMeasureFloor()`
    // (called from the resize listener) drops the floor back to 0
    // so a window resize can re-establish the right size.
    measure.floor = 0;
    // When true, `measure` will shrink the wrapper if the new
    // measurement is smaller than the current value. Polling keeps
    // this `false`; the resize handler flips it briefly.
    measure.allowShrink = false;
    const resetMeasureFloor = () => {
      measure.floor = 0;
      measure.allowShrink = true;
      measure();
      // Allow only the next call to shrink; restore default after.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measure.allowShrink = false;
        });
      });
    };

    const setup = () => {
      // ---- Tear down the previous setup's resources (if any) ----
      //
      // The iframe's `load` event fires on every navigation — both the
      // initial render AND any in-iframe link clicks we route through
      // `location.replace` (e.g. clicking a link inside the pasted
      // htmlraw navigates the iframe to the link target). The previous
      // version guarded with `setupDone` so `setup()` only ran once,
      // which left the *second* navigation in a broken state: a stale
      // ResizeObserver watching a detached body, a stale `measure.floor`
      // that prevented the wrapper from re-sizing to the new page, and
      // listeners wired to a now-detached document. Here we tear down
      // the previous setup at the START of every call so each
      // navigation starts from a clean slate.
      const prevCleanup = (iframe as unknown as {
        __rawhtmlCleanup?: () => void;
      }).__rawhtmlCleanup;
      if (prevCleanup) {
        prevCleanup();
        delete (iframe as unknown as { __rawhtmlCleanup?: () => void })
          .__rawhtmlCleanup;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      // Cancel any in-flight polling timeouts from the previous setup —
      // they'd otherwise fire `measure()` against a now-stale document.
      timeouts.forEach(clearTimeout);
      timeouts.length = 0;
      // Reset the measure floor so the new document can re-establish its
      // real height without being capped by the previous page's
      // measurement, and allow shrink so a shorter new page can shrink
      // the wrapper down to its real size.
      measure.floor = 0;
      measure.allowShrink = true;

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

      // Hide the iframe's own scrollbar so the outer page is the only
      // scroll surface the user sees. The pasted htmlraw landing pages
      // routinely have body content taller than the iframe's 100vh
      // viewport, which makes the iframe render its own vertical
      // scrollbar even though scrolling is fully controlled by the outer
      // page (wheel/touch inside the iframe is already redirected out via
      // `onIframeWheel` and the touch handlers below). Hiding the
      // scrollbar visually collapses those two scroll surfaces into one.
      //
      // `touch-action: none` is load-bearing for the mobile touch
      // handler below: without it, iOS Safari starts native scroll on
      // touchstart (before our touchmove can preventDefault), so the
      // iframe scrolls itself before our redirect runs and the user
      // sees the iframe move out of sync with the outer page.
      //
      // Taps on links / buttons still work — `touch-action: none`
      // disables native gesture handling but click events are still
      // synthesized normally by the browser, so the existing
      // `onClick` handler that routes in-iframe navigation through
      // `location.replace` continues to function.
      //
      // We re-run this on every setup() (after iframe load / in-iframe
      // navigation) — the previous document is gone and the new one
      // needs the same treatment. `__rawhtml_scrollbar_hider` is
      // looked up by id so we don't pile up duplicate <style> tags.
      const injectScrollbarHider = () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) return;
          let style = doc.getElementById('__rawhtml_scrollbar_hider');
          if (!style) {
            style = doc.createElement('style');
            style.id = '__rawhtml_scrollbar_hider';
            // srcdoc parses as a full document, but a pasted snippet
            // might omit <head>; in that case doc.head exists but is
            // empty — appendChild still works. Belt-and-braces fallback
            // for the rare case it doesn't.
            const target = doc.head || doc.documentElement || doc.body;
            if (!target) return;
            target.appendChild(style);
          }
          style.textContent = `
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
              touch-action: none;
            }
            html::-webkit-scrollbar,
            body::-webkit-scrollbar {
              display: none;
              width: 0;
              height: 0;
            }
          `;
        } catch {
          // Cross-origin — shouldn't happen for srcdoc, but guard anyway.
        }
      };
      injectScrollbarHider();

      // Defer initial measure by 2 animation frames so the browser has
      // had time to fully lay out the iframe content. We start with
      // `measure.allowShrink = true` (set in the teardown block above)
      // so a shorter new page can shrink the wrapper down to its real
      // size; then lock `allowShrink` back to false after the measure
      // runs so transient smaller measurements during the subsequent
      // polling/observer passes don't shrink the wrapper below its
      // high-water mark.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measure();
          requestAnimationFrame(() => {
            measure.allowShrink = false;
          });
        });
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

      // ---- One-way scroll sync: outer page → iframe ----
      //
      // Iframe is `position: sticky; top: 0; height: 100vh` so it
      // always fills the viewport as the outer page scrolls. To give
      // the user a single continuous scroll surface we mirror the
      // outer page's scrollY into the iframe as an offset relative
      // to the wrapper's top edge.
      //
      // Two-way sync would be cleaner in theory, but it ping-pongs:
      // scrolling outer triggers the iframe's `scroll` event, which
      // would trigger outer scroll back, ad infinitum. A
      // requestAnimationFrame-based re-entrancy flag doesn't help
      // because the scroll events fire *after* the RAF callback, so
      // by the time the iframe's `scroll` listener runs, the flag is
      // already cleared. Instead we go one-way (outer → iframe) and
      // redirect wheel events landing inside the iframe to the outer
      // page (see `onIframeWheel` below) so the user has only one
      // scroll surface to think about.
      try {
        const iwin = iframe.contentWindow;
        const idoc = iframe.contentDocument;
        if (iwin && idoc) {
          const outerToInner = () => {
            const wrapperRect = wrapper.getBoundingClientRect();
            const wrapperTop = window.scrollY + wrapperRect.top;
            const offset = Math.max(0, window.scrollY - wrapperTop);
            // Read the iframe's CURRENT document/window lazily instead
            // of using the captured `idoc`/`iwin` from this setup call.
            // Without this, during the brief window between an in-iframe
            // navigation starting (the iframe's `location.replace` call)
            // and the next `load` event re-running `setup()`, the captured
            // `idoc` points at the *previous* now-detached document whose
            // `scrollHeight` is 0 — so `max` becomes 0, every
            // `iwin.scrollTo` clamps to 0, and the iframe scroll visibly
            // freezes while the outer page keeps scrolling. Reading
            // `iframe.contentDocument` directly here always gives us the
            // current state.
            const liveDoc = iframe.contentDocument;
            const liveWin = iframe.contentWindow;
            if (!liveDoc || !liveWin) return;
            const max = Math.max(
              0,
              liveDoc.documentElement.scrollHeight - liveWin.innerHeight
            );
            // **Must use the options form with `behavior: 'instant'`.**
            // The pasted htmlraw typically has `html { scroll-behavior:
            // smooth }` — the legacy two-argument `scrollTo(x, y)`
            // form honours that preference, so the call would *animate*
            // to the target instead of jumping. Animations take
            // hundreds of ms; if a follow-up `outerToInner` fires
            // before the animation completes, it kicks off a second
            // animation that races with the first and the iframe ends
            // up at a random intermediate position — which is exactly
            // the "scrolls back up near the end" bug the user reported.
            // `behavior: 'instant'` is the standards-blessed way to
            // bypass the smooth-scroll preference for programmatic
            // jumps.
            liveWin.scrollTo({ top: Math.min(offset, max), behavior: 'instant' });
          };

          // Wheel events that land on the iframe area are redirected
          // to the outer page's scroll. The browser would otherwise
          // scroll the iframe's body and leave the outer page stuck,
          // making the iframe feel "out of sync" with the rest of
          // the page (the bug we're fixing). The outer `scroll`
          // listener above then mirrors the new outer scrollY back
          // into the iframe.
          //
          // The trailing `outerToInner()` is load-bearing: when the
          // outer page is already at max scroll, `window.scrollBy`
          // is a no-op and no scroll event fires, so the iframe
          // would otherwise stay stuck at whatever stale scrollY
          // it last synced to (e.g. after polling temporarily
          // shrunk the wrapper, then the wrapper grew back but the
          // iframe scroll was never re-pinned). Re-running
          // `outerToInner` here snaps the iframe to the correct
          // offset for the current outer scroll position.
          const onIframeWheel = (e: WheelEvent) => {
            e.preventDefault();
            window.scrollBy(0, e.deltaY);
            outerToInner();
          };

          // Mobile touch redirect — same idea as onIframeWheel, but
          // for the touch-only path. Mobile browsers don't synthesize
          // wheel events for touch, so without this a finger-drag
          // inside the iframe scrolls the iframe's body natively (iOS
          // rubber-band, Android native momentum) and the outer page
          // stays put, giving the user the confusing "two scroll
          // surfaces" experience.
          //
          // We track the initial touch Y on touchstart, then on
          // touchmove we preventDefault (so iOS doesn't kick off
          // native momentum scroll after the finger lifts) and pass
          // deltaY to the outer page. The existing outer→iframe
          // scroll sync then mirrors the new outer position back into
          // the iframe.
          //
          // `touch-action: none` (injected via injectScrollbarHider)
          // is load-bearing here: without it, iOS Safari starts
          // native scroll on touchstart before our touchmove can
          // preventDefault, leading to the iframe scrolling itself
          // before our redirect runs.
          //
          // We ignore multi-finger gestures — pinch-zoom inside the
          // iframe is disabled anyway by `touch-action: none`, and
          // tracking multiple touch points adds state for no UX gain.
          let lastTouchY = 0;
          const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            if (e.touches.length !== 1 || !t) return;
            lastTouchY = t.clientY;
          };
          const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (e.touches.length !== 1 || !t) return;
            e.preventDefault();
            const currentY = t.clientY;
            const deltaY = lastTouchY - currentY;
            lastTouchY = currentY;
            // scrollBy is a no-op when outer is at max scroll — no
            // scroll event fires — so we explicitly call outerToInner
            // to re-pin the iframe scroll to the right offset. Same
            // guard as onIframeWheel.
            window.scrollBy(0, deltaY);
            outerToInner();
          };
          const onTouchEnd = () => {
            lastTouchY = 0;
          };

          window.addEventListener('scroll', outerToInner, { passive: true });
          iwin.addEventListener('wheel', onIframeWheel, { passive: false });
          iwin.addEventListener('touchstart', onTouchStart, { passive: true });
          iwin.addEventListener('touchmove', onTouchMove, { passive: false });
          iwin.addEventListener('touchend', onTouchEnd, { passive: true });

          // On outer window resize, 100vh changes → iframe viewport
          // changes → re-pin vh values to the new viewport height
          // so any `min-height: 100vh` etc. scales correctly, and
          // re-measure the wrapper because the inner content height
          // might shift. We have to drop the measure floor first
          // so the wrapper is allowed to shrink if the new
          // viewport (and therefore the vh-bearing hero) is smaller.
          const onResize = () => {
            overrideVhUnits();
            injectScrollbarHider();
            resetMeasureFloor();
          };
          window.addEventListener('resize', onResize, { passive: true });

          // Stash all the new teardowns alongside the click
          // cleanup we registered above so the effect's return can
          // run them all.
          const extraCleanups = () => {
            window.removeEventListener('scroll', outerToInner);
            iwin.removeEventListener('wheel', onIframeWheel);
            iwin.removeEventListener('touchstart', onTouchStart);
            iwin.removeEventListener('touchmove', onTouchMove);
            iwin.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('resize', onResize);
          };
          const prev =
            (iframe as unknown as { __rawhtmlCleanup?: () => void })
              .__rawhtmlCleanup;
          (iframe as unknown as { __rawhtmlCleanup?: () => void }).__rawhtmlCleanup =
            () => {
              prev?.();
              extraCleanups();
            };

          // Initial sync after first measure so the iframe scroll
          // matches the user's current scroll position (relevant if
          // they land mid-page via deep link / browser back).
          requestAnimationFrame(() => {
            requestAnimationFrame(outerToInner);
          });
        }
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
    //
    // iframe is `position: sticky; top: 0; height: 100vh; z-index: 1`
    // so it stays in view as the parent page scrolls and the iframe
    // viewport remains permanently smaller than the inner document
    // (which is what makes `position: sticky` *inside* the iframe
    // engage correctly). z-index 1 keeps it above any in-iframe
    // backgrounds; our app's sticky header overlays it from above
    // via its own z-index.
    <div ref={wrapperRef} style={{ width: '100%' }}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Embedded page"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      />
    </div>
  );
}