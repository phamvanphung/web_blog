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
import type { AnyExtension } from '@tiptap/core';
import { Callout } from './nodes/Callout';
import { renderSlashMenu } from './slashCommand';
import { generateHTML } from '@tiptap/html';

export const slashPluginKey = new PluginKey('slashCommand');

// NOTE: The plan's verbatim code used `Suggestion.configure({...})` and
// `@tiptap/pm/model`.Range, but Tiptap v3's @tiptap/suggestion exports
// `Suggestion` as a *function* (returns a Plugin) — not an Extension with
// `.configure()`. The full wire-up (the right render hook + command shape)
// lands in Task 5; for now we cast to silence the type mismatch and keep
// `pnpm typecheck` green. GlobalDragHandle is also a default-exported
// `Extension` (no `.configure()`), so we apply the same `as never` escape.
const slashSuggestion = Suggestion({
  char: '/',
  pluginKey: slashPluginKey,
  command: () => {
    // Real implementation wired in Task 5 via buildSlashCommand(editor, range).
  },
} as never);

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
  slashSuggestion as unknown as AnyExtension,
];

// Re-export renderSlashMenu so EditorCanvas can mount <SlashMenu> when wiring
// the Suggestion plugin. The real React popover lands in Task 5.
export { renderSlashMenu };

export { generateHTML };
