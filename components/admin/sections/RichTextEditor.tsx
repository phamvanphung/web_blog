'use client';
import type { RichTextSection } from '@/modules/pages/types';

type Props = {
  section: RichTextSection;
  onChange: (next: RichTextSection) => void;
};

export function RichTextEditor({ section, onChange }: Props) {
  // For v1: simple textarea that wraps plain text in Tiptap JSON.
  // Full Tiptap integration is out of scope.
  const d = section.data;

  // Derive plain text from the Tiptap JSON for the textarea display
  function extractText(json: unknown): string {
    if (!json || typeof json !== 'object') return '';
    const doc = json as { type?: string; content?: unknown[]; text?: string };
    if (!doc.content) return '';
    return doc.content.map((node) => {
      if (typeof node === 'object' && node !== null) {
        const n = node as { type?: string; content?: unknown[]; text?: string };
        if (n.type === 'paragraph' && n.content) {
          return n.content.map((c) => (typeof c === 'object' && c !== null ? (c as { text?: string }).text ?? '' : '')).join('');
        }
      }
      return '';
    }).join('\n');
  }

  function wrapInTiptap(text: string): { type: 'doc'; content: { type: 'paragraph'; content: { type: 'text'; text: string }[] }[] } {
    if (!text.trim()) {
      return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
    }
    return {
      type: 'doc',
      content: text.split('\n\n').map((para) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: para }]
      }))
    };
  }

  return (
    <textarea
      rows={6}
      value={extractText(d.json)}
      onChange={(e) => {
        onChange({ ...section, data: { json: wrapInTiptap(e.target.value) } });
      }}
      placeholder="Nhập nội dung văn bản (plain text)..."
      className="w-full rounded-8 border border-hairline bg-canvas px-3 py-2 text-[14px] leading-relaxed"
    />
  );
}
