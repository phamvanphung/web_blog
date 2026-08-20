import { describe, it, expect } from 'vitest';
import type { Section } from '@/modules/pages/types';

/**
 * Mirrors the contentToRichtextSection helper from scripts/migrate-pages-to-sections.ts.
 * Duplicated here so the test stays deterministic and doesn't need to import the script
 * (which may have top-level Prisma / DB calls).
 */
function contentToRichtextSection(content: string): Section {
  return {
    kind: 'richtext',
    id: 'sec_' + Math.random().toString(36).slice(2, 10),
    data: {
      json: {
        type: 'doc',
        content: content.length
          ? [{ type: 'paragraph', content: [{ type: 'text', text: content }] }]
          : [{ type: 'paragraph' }]
      }
    }
  };
}

describe('contentToRichtextSection', () => {
  it('produces a richtext section with one paragraph', () => {
    const s = contentToRichtextSection('Hello');
    expect(s.kind).toBe('richtext');
    if (s.kind === 'richtext') {
      const doc = s.data.json as { type: string; content: Array<{ type: string; content?: Array<{ text: string }> }> };
      expect(doc.type).toBe('doc');
      expect(doc.content).toHaveLength(1);
      const para = doc.content[0]!;
      expect(para.type).toBe('paragraph');
      expect(para.content?.[0]!.text).toBe('Hello');
    }
  });

  it('produces an empty paragraph for empty content', () => {
    const s = contentToRichtextSection('');
    if (s.kind === 'richtext') {
      const doc = s.data.json as { content: Array<{ type: string; content?: unknown[] }> };
      expect(doc.content).toHaveLength(1);
      const para = doc.content[0]!;
      expect(para.type).toBe('paragraph');
      expect(para.content).toBeUndefined();
    }
  });
});
