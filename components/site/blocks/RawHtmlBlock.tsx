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
 * Wrap a script body in an IIFE so top-level `const` / `let` declarations
 * are local to that script's execution. Two scripts that both declare
 * `const navbar = …` no longer collide across script tags.
 *
 * Caveat: `function` declarations and `var` declarations inside the IIFE
 * are also scoped to it (not added to `window`), so cross-script refs
 * that rely on implicit globals will break. The admin can opt in to
 * shared globals with explicit `window.foo = …` assignments if needed.
 *
 * We also wrap each script in try/catch so one bad script can't kill
 * the rest (which is what was happening before this fix — a redeclaration
 * SyntaxError on script #2 aborted every later script on the page).
 */
function wrapScript(js: string, idx: number): string {
  return `(function(){try{\n${js}\n}catch(e){console.error('[RawHtmlBlock script #${idx}]',e);}})();`;
}

/**
 * Raw HTML escape hatch for Page sections. Two shapes:
 *
 * 1. **Full HTML document** — admin pastes a complete page (e.g. a
 *    Claude-generated landing page) with `<!DOCTYPE>`, `<html>`,
 *    `<head>`, `<body>`. We extract `<style>` and `<script>` blocks
 *    and render them as siblings (React + dangerouslySetInnerHTML) so
 *    CSS applies and scripts execute in the right places.
 *
 * 2. **Fragment** — just a chunk of HTML. Render as-is.
 *
 * Script ordering: body MUST come BEFORE the `<script>` tags in the
 * rendered output. Browsers parse HTML top-to-bottom and execute each
 * `<script>` as they hit it — so scripts need the body DOM to be
 * present when they run, otherwise `document.getElementById('foo')`
 * returns null.
 */
export function RawHtmlBlock({ html }: Props) {
  if (!isFullDocument(html)) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const styles = extractBlocks(html, 'style');
  const scripts = extractBlocks(html, 'script');
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
      {scripts.map((js, i) => (
        <script
          /* eslint-disable-next-line react/no-array-index-key */
          key={`rawscript-${i}`}
          dangerouslySetInnerHTML={{ __html: wrapScript(js, i) }}
        />
      ))}
    </>
  );
}