// components/editor/extensions.ts
// Tiptap extension bundle. Server-side use of @tiptap/html imports these too.

import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { TableKit } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { Suggestion } from '@tiptap/suggestion';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import { PluginKey } from '@tiptap/pm/state';
import { Extension, type AnyExtension } from '@tiptap/core';

import { Callout } from './nodes/Callout';
import { renderSlashMenu } from './slashCommand';
import { generateHTML } from '@tiptap/html';

export const slashPluginKey = new PluginKey('slashCommand');

// NOTE: Tiptap v3's @tiptap/suggestion exports `Suggestion` as a *function*
// (returns a ProseMirror `Plugin`) — not a Tiptap `Extension`. Suggestion is
// wrapped in an Extension that exposes it via `addProseMirrorPlugins`
// (Suggestion itself returns a raw Plugin, which `splitExtensions()` would
// otherwise filter out). The full wire-up (the right render hook + command
// shape) lands in Task 5; for now we just satisfy the Suggestion config shape
// and keep `pnpm typecheck` green. GlobalDragHandle is a default-exported
// `Extension` (no `.configure()`), so we cast it to `AnyExtension`.
const SlashCommandExtension = Extension.create({
  name: 'suggestion', // matches Task 10's `editor.extensionManager.extensions.find((e) => e.name === 'suggestion')`
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        pluginKey: slashPluginKey,
        // Real command wiring lands in Task 5 (slashCommand.ts -> buildSlashCommand).
        // For now we just satisfy the Suggestion config shape.
        command: () => undefined,
      }),
    ];
  },
});

export const extensionBundle: AnyExtension[] = [
  StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'language-plain' } } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Image.configure({ inline: false, allowBase64: false }),
  Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
  TableKit.configure({ table: { resizable: true } }),
  Placeholder.configure({ placeholder: 'Bắt đầu viết, hoặc gõ / để chèn block…' }),
  Callout,
  BubbleMenu,
  GlobalDragHandle as unknown as AnyExtension,
  SlashCommandExtension,
];

// Re-export renderSlashMenu so EditorCanvas can mount <SlashMenu> when wiring
// the Suggestion plugin. The real React popover lands in Task 5.
export { renderSlashMenu };

export { generateHTML };
