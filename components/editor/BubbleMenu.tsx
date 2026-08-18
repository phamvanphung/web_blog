'use client';

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';

type CommandSpec =
  | { kind: 'toggle'; name: 'bold' | 'italic' | 'underline' | 'strike' | 'code' }
  | { kind: 'fn'; run: () => void };

function runCommand(editor: Editor, spec: CommandSpec) {
  if (spec.kind === 'fn') {
    spec.run();
    return;
  }
  switch (spec.name) {
    case 'bold':
      editor.chain().focus().toggleBold().run();
      return;
    case 'italic':
      editor.chain().focus().toggleItalic().run();
      return;
    case 'underline':
      editor.chain().focus().toggleUnderline().run();
      return;
    case 'strike':
      editor.chain().focus().toggleStrike().run();
      return;
    case 'code':
      editor.chain().focus().toggleCode().run();
      return;
  }
}

function isActiveFor(editor: Editor, spec: CommandSpec): boolean {
  if (spec.kind !== 'toggle') return false;
  switch (spec.name) {
    case 'bold':
      return editor.isActive('bold');
    case 'italic':
      return editor.isActive('italic');
    case 'underline':
      return editor.isActive('underline');
    case 'strike':
      return editor.isActive('strike');
    case 'code':
      return editor.isActive('code');
  }
}

interface BtnProps {
  editor: Editor;
  spec: CommandSpec;
  label: string;
  title: string;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  mono?: boolean;
}

function Btn({ editor, spec, label, title, italic, underline, strike, mono }: BtnProps) {
  const active = isActiveFor(editor, spec);

  const style = [
    'px-2 py-1 rounded text-sm transition-colors',
    'font-[500] leading-none',
    active ? 'bg-canvas-parchment text-ink' : 'text-ink-80 hover:bg-canvas-parchment',
    italic ? 'italic' : '',
    underline ? 'underline' : '',
    strike ? 'line-through' : '',
    mono ? 'font-mono' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" title={title} onClick={() => runCommand(editor, spec)} className={style}>
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
      <Btn editor={editor} spec={{ kind: 'toggle', name: 'bold' }} label="B" title="Bold (⌘B)" />
      <Btn
        editor={editor}
        spec={{ kind: 'toggle', name: 'italic' }}
        label="I"
        title="Italic (⌘I)"
        italic
      />
      <Btn
        editor={editor}
        spec={{ kind: 'toggle', name: 'underline' }}
        label="U"
        title="Underline (⌘U)"
        underline
      />
      <Btn
        editor={editor}
        spec={{ kind: 'toggle', name: 'strike' }}
        label="S"
        title="Strikethrough"
        strike
      />
      <Btn
        editor={editor}
        spec={{ kind: 'toggle', name: 'code' }}
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
