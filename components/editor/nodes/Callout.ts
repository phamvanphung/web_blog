// components/editor/nodes/Callout.ts
// Custom Tiptap node — boxed note block with two tones (info, warn).
// Mirrors the shape `Tiptap.Node.create({...})` expects for the editor bundle.
//
// NOTE: do NOT import CalloutView (or ReactNodeViewRenderer) at module top.
// @tiptap/react pulls JSX into the bundle; loading it during `pnpm test`
// (vitest env=node) forces Vite to parse JSX in a non-JSX environment.
// Instead we lazily require both inside `addNodeView()`, which the unit test
// path never reaches (the schema-only test never instantiates a NodeView).
import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutTone = 'info' | 'warn';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { tone?: CalloutTone }) => ReturnType;
    };
  }
}

/**
 * Callout — boxed note block. Two tones: info (slate) and warn (amber).
 * Content model: `block+` so users can put a heading + paragraph inside.
 */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      tone: {
        default: 'info',
        parseHTML: (el) => (el.getAttribute('data-tone') as CalloutTone) ?? 'info',
        renderHTML: (attrs) => ({ 'data-tone': attrs.tone }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'callout' }),
      0,
    ];
  },

  addNodeView() {
    // Lazy require so unit tests (node env, no JSX) don't load CalloutView.tsx
    // or @tiptap/react (which drags JSX into the dependency graph).
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { ReactNodeViewRenderer } = require('@tiptap/react') as typeof import('@tiptap/react');
    const { CalloutView } = require('./CalloutView') as typeof import('./CalloutView');
    /* eslint-enable @typescript-eslint/no-require-imports */
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      // Use `insertContent` rather than `wrapIn`: the slash menu deletes the
      // current range (collapsing to an empty selection) before invoking this
      // command, and `wrapIn` requires a non-empty range to wrap — so on an
      // empty selection it silently fails and the callout never appears.
      // `insertContent` with a JSONContent spec works regardless of selection.
      setCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'callout',
            attrs,
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});

