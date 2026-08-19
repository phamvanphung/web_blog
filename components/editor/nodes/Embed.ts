// components/editor/nodes/Embed.ts
// Custom Tiptap node — generic iframe embed. Used by the slash menu's
// "Embed" item when the user pastes any http(s) URL.
//
// In the editor: a NodeView renders a placeholder card with the URL
// (live iframes are a security/UX concern inside an admin editor).
// In public HTML: the iframe renders normally via `renderHTML`.
//
// Mirrors the lazy-require pattern from Callout.ts so unit tests in
// node env (no JSX) don't drag @tiptap/react into the bundle.
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (attrs: { src: string }) => ReturnType;
    };
  }
}

/**
 * Embed — block-level iframe node. Stores the source URL as `src`.
 *
 * Schema notes:
 *  - `atom: true` because the iframe is opaque to the cursor — pressing
 *    arrow inside selects it, not the URL text.
 *  - `group: 'block'` so the user can place it on its own line.
 *  - `draggable: true` so the drag handle can reorder it like any block.
 */
export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (el) => (el.getAttribute('src') as string | null) ?? null,
        renderHTML: (attrs) => (attrs.src ? { src: attrs.src } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        allowfullscreen: '',
        loading: 'lazy',
        frameborder: '0'
      })
    ];
  },

  addNodeView() {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { ReactNodeViewRenderer } = require('@tiptap/react') as typeof import('@tiptap/react');
    const { EmbedView } = require('./EmbedView') as typeof import('./EmbedView');
    /* eslint-enable @typescript-eslint/no-require-imports */
    return ReactNodeViewRenderer(EmbedView);
  },

  addCommands() {
    return {
      setEmbed:
        ({ src }) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'embed',
            attrs: { src }
          }),
    };
  }
});
