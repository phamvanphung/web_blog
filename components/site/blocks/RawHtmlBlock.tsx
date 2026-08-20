type Props = {
  html: string;
};

/**
 * Raw HTML escape hatch. Handles two shapes:
 *
 * 1. **Full HTML document** — when the admin pastes an entire page (e.g. a
 *    Claude-generated landing page) including `<!DOCTYPE>`, `<html>`, `<head>`,
 *    `<body>`. We extract the `<style>` and `<script>` blocks and render them
 *    as siblings (React + dangerouslySetInnerHTML) so they apply/execute
 *    in the right places, then render only the body content.
 *
 * 2. **Fragment** — just a chunk of HTML. Render as-is via dangerouslySetInnerHTML.
 *
 * Either way the chrome (Tile / Container / prose styles) is intentionally
 * NOT applied here — the admin authored the markup, they own the layout.
 */
function isFullDocument(h: string): boolean {
  const t = h.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html');
}

function extractBlocks(h: string, tag: 'style' | 'script'): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
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
      {/*
        Body MUST come BEFORE the <script> tags in the rendered output.
        Browsers parse HTML top-to-bottom and execute each <script> as they
        hit it — so scripts need the body DOM to be present when they run,
        otherwise `document.getElementById('foo')` returns null.
      */}
      <div dangerouslySetInnerHTML={{ __html: body }} />
      {scripts.map((js, i) => (
        <script
          /* eslint-disable-next-line react/no-array-index-key */
          key={`rawscript-${i}`}
          dangerouslySetInnerHTML={{ __html: js }}
        />
      ))}
    </>
  );
}
