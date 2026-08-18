'use client';

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';

interface BtnProps {
  editor: Editor;
  cmd: string;
  label: string;
  title: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  mono?: boolean;
}

function markName(cmd: string): string {
  switch (cmd) {
    case 'toggleBold':
      return 'bold';
    case 'toggleItalic':
      return 'italic';
    case 'toggleStrike':
      return 'strike';
    case 'toggleCode':
      return 'code';
    case 'toggleUnderline':
      return 'underline';
    default:
      return '';
  }
}

function Btn({ editor, cmd, label, title, italic, underline, strike, mono }: BtnProps) {
  const name = markName(cmd);
  const isActive = name ? editor.isActive(name) : false;
  const handler =
    typeof editor[cmd as keyof Editor] === 'function'
      ? () => (editor.chain().focus() as any)[cmd]().run()
      : undefined;

  const style = [
    'px-2 py-1 rounded text-sm transition-colors',
    'font-[500] leading-none',
    isActive
      ? 'bg-canvas-parchment text-ink'
      : 'text-ink-80 hover:bg-canvas-parchment',
    italic ? 'italic' : '',
    underline ? 'underline' : '',
    strike ? 'line-through' : '',
    mono ? 'font-mono' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" title={title} onClick={handler} className={style}>
      {label}
    </button>
  );
}

function Separator() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-hairline" />;
}

function LinkBtn({ editor }: { editor: Editor }) {
  const isActive = editor.isActive('link');

  const onClick = () => {
    if (isActive) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <button
      type="button"
      title={isActive ? 'Bỏ link' : 'Thêm link'}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm transition-colors font-[500] leading-none ${
        isActive
          ? 'bg-canvas-parchment text-ink'
          : 'text-ink-80 hover:bg-canvas-parchment'
      }`}
    >
      🔗
    </button>
  );
}

export function BubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="bubble-menu flex items-center gap-1 rounded-11 border border-hairline bg-canvas px-1 py-1 shadow-md"
    >
      <Btn editor={editor} cmd="toggleBold" label="B" title="Bold (⌘B)" />
      <Btn
        editor={editor}
        cmd="toggleItalic"
        label="I"
        title="Italic (⌘I)"
        italic
      />
      <Btn
        editor={editor}
        cmd="toggleUnderline"
        label="U"
        title="Underline (⌘U)"
        underline
      />
      <Btn
        editor={editor}
        cmd="toggleStrike"
        label="S"
        title="Strikethrough"
        strike
      />
      <Btn
        editor={editor}
        cmd="toggleCode"
        label="</>"
        title="Inline code"
        mono
      />
      <Separator />
      <LinkBtn editor={editor} />
      <Separator />
      <button
        type="button"
        title="Xoá định dạng"
        onClick={() =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        }
        className="px-2 py-1 rounded text-sm transition-colors font-[500] leading-none text-ink-80 hover:bg-canvas-parchment"
      >
        ✕
      </button>
    </TiptapBubbleMenu>
  );
}
