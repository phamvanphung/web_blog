// components/editor/nodes/CalloutView.tsx
// React renderer for the custom `callout` Tiptap node. The actual `<NodeViewWrapper>`
// becomes the `aside.callout` element in the DOM; the editor injects the editable
// children (a NodeViewContent) via `contentEditable` on the wrapper. We render an
// icon span next to the children so the structure matches the server-side render
// path in modules/posts/server/render.ts.

'use client';

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';

export function CalloutView({ node, editor }: NodeViewProps) {
  const tone = (node.attrs.tone as 'info' | 'warn') ?? 'info';
  const icon = tone === 'warn' ? '⚠' : 'ℹ';
  return (
    <NodeViewWrapper
      as="aside"
      data-callout=""
      data-tone={tone}
      contentEditable={editor.isEditable}
      suppressContentEditableWarning
      className={`callout callout-${tone}`}
    >
      <span className="callout-icon" aria-hidden="true">
        {icon}
      </span>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}
