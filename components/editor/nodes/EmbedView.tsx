// components/editor/nodes/EmbedView.tsx
// React renderer for the custom `embed` Tiptap node.
//
// We deliberately render a *placeholder card* inside the editor instead of a
// live iframe. Reasons:
//   1. The admin editor is the wrong place for a 16:9 embed — live iframes
//      steal focus, capture scroll, and pull third-party cookies/scripts.
//   2. Authors need to *see* the URL they're pointing at, not a generic
//      chrome-less iframe hole. The card surfaces the URL plus a "Remove" /
//      "Open" affordance.
//   3. In the *public* post HTML, Embed's `renderHTML` emits a real iframe
//      (with `loading="lazy"`, `allowfullscreen`, `frameborder="0"`). The
//      placeholder lives only in the editor surface area.
//
// This mirrors the lazy-require pattern from CalloutView/Embed so unit tests
// in node env (no JSX) don't pull @tiptap/react into the bundle.

'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function EmbedView({ node, deleteNode }: NodeViewProps) {
  const src = (node.attrs.src as string | null) ?? '';
  let host = '';
  try {
    host = new URL(src).host || src;
  } catch {
    host = src || '(không có URL)';
  }

  return (
    <NodeViewWrapper
      as="div"
      data-embed=""
      className="embed-block"
      // contentEditable is on the wrapper so the user can still type around
      // the block (Tiptap's atom rule: arrows select the block, typing
      // replaces/inserts around it).
      contentEditable={false}
    >
      <div className="embed-block-frame" aria-hidden="true">
        <span className="embed-block-icon">⧉</span>
      </div>
      <div className="embed-block-body">
        <div className="embed-block-label">Embed</div>
        <div className="embed-block-host" title={src}>
          {host}
        </div>
        {src ? (
          <a
            className="embed-block-link"
            href={src}
            target="_blank"
            rel="noopener noreferrer"
          >
            Mở trong tab mới ↗
          </a>
        ) : (
          <div className="embed-block-link embed-block-link--empty">
            URL trống — block này sẽ không hiển thị ngoài trang.
          </div>
        )}
      </div>
      <button
        type="button"
        className="embed-block-remove"
        onClick={() => deleteNode()}
        aria-label="Xoá embed"
        title="Xoá embed"
      >
        ✕
      </button>
    </NodeViewWrapper>
  );
}
