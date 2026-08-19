// components/editor/slashCommands.ts
// Per-call id→command map wired to SLASH_ITEMS ids.
// Built fresh per invocation so the `range` closure is always current.

import type { Editor, Range } from '@tiptap/core';

export type SlashCommandMap = Record<string, () => void>;

function requestModal(editor: Editor, kind: 'image' | 'video') {
  (editor as unknown as { __modalRequest?: { kind: 'image' | 'video' } }).__modalRequest = { kind };
  // No-op transaction so React notices the edit and re-renders.
  editor.view.dispatch(editor.state.tr.setMeta('modalRequest', kind));
}

export function getSlashCommands(editor: Editor, range: Range): SlashCommandMap {
  const deleteTrigger = () => editor.chain().focus().deleteRange(range);

  return {
    paragraph: () => deleteTrigger().setParagraph().run(),
    h1: () => deleteTrigger().setHeading({ level: 1 }).run(),
    h2: () => deleteTrigger().setHeading({ level: 2 }).run(),
    h3: () => deleteTrigger().setHeading({ level: 3 }).run(),
    bullet: () => deleteTrigger().toggleBulletList().run(),
    ordered: () => deleteTrigger().toggleOrderedList().run(),
    todo: () => deleteTrigger().toggleTaskList().run(),
    quote: () => deleteTrigger().toggleBlockquote().run(),
    code: () => deleteTrigger().toggleCodeBlock().run(),
    divider: () => deleteTrigger().setHorizontalRule().run(),

    // Callout uses insertContent (NOT wrapIn) — see Callout.ts addCommands note.
    'callout-info': () =>
      deleteTrigger()
        .insertContent({ type: 'callout', attrs: { tone: 'info' }, content: [{ type: 'paragraph' }] })
        .run(),
    'callout-warn': () =>
      deleteTrigger()
        .insertContent({ type: 'callout', attrs: { tone: 'warn' }, content: [{ type: 'paragraph' }] })
        .run(),

    // 2×2 starter table — each row has tableHeader + tableCell cells with empty paragraphs.
    // TableKit (from @tiptap/extension-table) provides these node types.
    table: () => {
      const cellWithParagraph = (type: 'tableHeader' | 'tableCell') => ({
        type,
        content: [{ type: 'paragraph' }],
      });
      const row = (cells: ReturnType<typeof cellWithParagraph>[]) => ({
        type: 'tableRow',
        content: cells,
      });
      deleteTrigger()
        .insertContent({
          type: 'table',
          content: [row([cellWithParagraph('tableHeader'), cellWithParagraph('tableCell')]), row([cellWithParagraph('tableHeader'), cellWithParagraph('tableCell')])],
        })
        .run();
    },

    image: () => requestModal(editor, 'image'),
    video: () => requestModal(editor, 'video'),

    embed: () => {
      const url = window.prompt('Dán URL embed (iframe)…');
      if (!url) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        window.alert('Chỉ hỗ trợ URL http(s).');
        return;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        window.alert('Chỉ hỗ trợ URL http(s).');
        return;
      }
      // Insert as a custom `embed` node (see components/editor/nodes/Embed.ts)
      // rather than raw `<iframe>` HTML. Tiptap's schema doesn't recognize
      // `<iframe>` — `insertContent` with an HTML string falls back to text
      // parsing and the literal `<iframe …>` ends up escaped into the
      // paragraph as text. The custom node serialises to a real iframe in
      // public HTML via `renderHTML`.
      deleteTrigger()
        .setEmbed({ src: parsed.toString() })
        .run();
    },
  };
}
