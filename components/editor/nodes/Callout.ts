// components/editor/nodes/Callout.ts
// Custom Tiptap node — boxed note block with two tones (info, warn).
// Mirrors the shape `Tiptap.Node.create({...})` expects for the editor bundle,
// and exposes a `getSchema()` helper used by unit tests to exercise the spec
// in isolation (no StarterKit, no editor instance).

// NOTE: do NOT import CalloutView (or ReactNodeViewRenderer) at module top.
// @tiptap/react pulls JSX into the bundle; loading it during `pnpm test`
// (vitest env=node) forces Vite to parse JSX in a non-JSX environment.
// Instead we lazily require both inside `addNodeView()`, which the unit test
// path never reaches (the schema-only test never instantiates a NodeView).
import { Node, mergeAttributes } from '@tiptap/core';
import { Schema, type Node as ProseMirrorNode } from '@tiptap/pm/model';

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
        default: 'info' as CalloutTone,
        parseHTML: (el) => (el.getAttribute('data-tone') as CalloutTone) ?? 'info',
        renderHTML: (attrs) => ({ 'data-tone': attrs.tone as string }),
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
      setCallout:
        (attrs = {}) =>
        ({ commands }) =>
          commands.wrapIn(this.type, attrs),
    };
  },
});

/**
 * Build a minimal ProseMirror Schema containing Callout + paragraph + text
 * (plus a top-level `doc`). Lets unit tests exercise Callout's spec without
 * pulling in the rest of StarterKit or instantiating a full editor.
 */
export function getSchema(): Schema {
  return new Schema({
    nodes: {
      doc: {
        content: 'block+',
      },
      paragraph: {
        group: 'block',
        content: 'inline*',
        parseDOM: [{ tag: 'p' }],
        toDOM: () => ['p', 0],
      },
      text: {
        group: 'inline',
      },
      callout: {
        group: 'block',
        content: 'block+',
        defining: true,
        attrs: {
          tone: {
            default: 'info',
          },
        },
        parseDOM: [
          {
            tag: 'aside[data-callout]',
            getAttrs: (dom: HTMLElement | string) => {
              const el = (typeof dom === 'string' ? document.querySelector(dom) : dom) as HTMLElement | null;
              const tone = (el?.getAttribute('data-tone') ?? 'info') as CalloutTone;
              return { tone };
            },
          },
        ],
        toDOM: (node: ProseMirrorNode) => [
          'aside',
          { 'data-callout': '', 'data-tone': String(node.attrs.tone ?? 'info'), class: 'callout' },
          0,
        ],
      },
    },
  });
}
