// components/site/blocks/vhPin.ts
//
// Pure helper that rewrites `<number>vh` tokens inside a CSS declaration
// value to their pixel equivalent at a given viewport height. Extracted
// from <RawHtmlBlock> so we can regression-test it without importing a
// `'use client'` JSX file (Vitest's native import-analysis chokes on
// JSX in client modules).
//
// Used by RawHtmlBlock's `overrideVhUnits` to break the feedback loop
// between iframe viewport sizing and any vh-based layout properties on
// the pasted landing page. The full reasoning lives next to the helper.

const VH_TOKEN = /(-?[\d.]+)vh\b/g;

/**
 * Replace every `<number>vh` token inside `value` with its pixel
 * equivalent pinned at `viewportPx`. Mixed expressions keep their
 * structure so `calc(100vh - 52px)` becomes `calc(911px - 52px)`.
 *
 * @example
 *   replaceVhUnits('100vh', 911)              → '911px'
 *   replaceVhUnits('calc(100vh - 52px)', 911) → 'calc(911px - 52px)'
 *   replaceVhUnits('min(100vh, 800px)', 1000) → 'min(1000px, 800px)'
 */
export function replaceVhUnits(value: string, viewportPx: number): string {
  if (!value || !Number.isFinite(viewportPx) || viewportPx <= 0) return value;
  return value.replace(VH_TOKEN, (_, numStr: string) => {
    const num = parseFloat(numStr);
    return `${(num * viewportPx) / 100}px`;
  });
}
