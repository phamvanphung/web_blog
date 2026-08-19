// components/editor/extensions.ts
// Tiptap extension bundle. Server-side use of @tiptap/html imports these too.

import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { Suggestion } from '@tiptap/suggestion';
import GlobalDragHandle from 'tiptap-extension-global-drag-handle';
import { PluginKey } from '@tiptap/pm/state';
import { Extension, type AnyExtension } from '@tiptap/core';

import { Callout } from './nodes/Callout';
import { Embed } from './nodes/Embed';
import { renderSlashMenu, defaultSlashFilter, buildSlashCommand } from './slashCommand';
import type { SlashItem } from './slashItems';
import type { Editor, Range } from '@tiptap/core';
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
        items: ({ query }: { query: string }) => defaultSlashFilter(query),
        render: renderSlashMenu,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: { item: SlashItem } }) => {
          buildSlashCommand(editor, range)(props.item);
        },
      }),
    ];
  },
});

export const extensionBundle: AnyExtension[] = [
  StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'language-plain' } } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Underline,
  Image.configure({ inline: false, allowBase64: false }),
  Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
  TableKit.configure({ table: { resizable: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder: 'Bắt đầu viết, hoặc gõ / để chèn block…' }),
  Callout,
  Embed,
  BubbleMenu,
  (GlobalDragHandle as unknown as AnyExtension).configure({ dragHandleWidth: 24 }),
  SlashCommandExtension,
];

// Re-export renderSlashMenu so EditorCanvas can mount <SlashMenu> when wiring
// the Suggestion plugin. The real React popover lands in Task 5.
export { renderSlashMenu };

export { generateHTML };
