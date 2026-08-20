'use client';

import { useEffect } from 'react';

type Props = {
  html: string;
};

function isFullDocument(h: string): boolean {
  const t = h.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

function extractBlocks(h: string, tag: 'style' | 'script'): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(h)) !== null) {
    const body = m[1];
    if (body !== undefined) out.push(body);
  }
  return out;
}

function extractBody(h: string): string {
  const m = h.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return m?.[1] ?? h;
}

/**
 * Raw HTML escape hatch for Page sections. Two shapes:
 *
 * 1. **Full HTML document** — admin pastes a complete page (e.g. a
 *    Claude-generated landing page) with `<!DOCTYPE>`, `<html>`, `<head>`,
 *    `<body>`. We:
 *    - Render `<style>` blocks via `<style dangerouslySetInnerHTML>` so
 *      CSS applies.
 *    - Render the body via `dangerouslySetInnerHTML` — Next.js still
 *      SSRs the body into the HTML response (no first-paint flicker).
 *    - Defer `<script>` execution to `useEffect` after hydration, with
 *      each script wrapped in an IIFE. This fixes three things:
 *        a) Scripts execute after the body is in the DOM, so
 *           `document.getElementById('year')` resolves.
 *        b) React 19 + Next.js Fast Refresh / Strict Mode re-runs
 *           effects in dev. Without an IIFE, two scripts both declaring
 *           `const navbar = …` would throw "Identifier 'navbar' has
 *           already been declared" on the second run. Each IIFE gets
 *           its own scope → no redeclaration collision.
 *        c) One bad script can't kill the rest — we try/catch per script.
 *
 * 2. **Fragment** — render as-is. Scripts inside fragment HTML never
 *    execute (the innerHTML parser skips them by design); admin must
 *    use a full document for script support.
 */
export function RawHtmlBlock({ html }: Props) {
  useEffect(() => {
    if (!isFullDocument(html)) return;
    const scripts = extractBlocks(html, 'script');
    scripts.forEach((js, i) => {
      try {
        // IIFE so top-level `const` / `let` are local to this run. Two
        // scripts that both declare `const navbar = …` won't collide.
        new Function(`(function(){\n${js}\n})();`)();
      } catch (e) {
        console.error(`[RawHtmlBlock] script #${i} failed:`, e);
      }
    });
  }, [html]);

  if (!isFullDocument(html)) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const styles = extractBlocks(html, 'style');
  const body = extractBody(html);

  return (
    <>
      {styles.map((css, i) => (
        <style
          /* eslint-disable-next-line react/no-array-index-key */
          key={`rawstyle-${i}`}
          dangerouslySetInnerHTML={{ __html: css }}
        />
      ))}
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
}