import { describe, it, expect } from 'vitest';
import { deriveContentFromSections, sectionToHtml } from '@/modules/pages/server/render';

describe('sectionToHtml', () => {
  it('returns html for richtext', () => {
    const result = sectionToHtml({
      kind: 'richtext',
      id: 'r1',
      data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] } }
    });
    expect(result?.kind).toBe('richtext');
    expect(result?.html).toContain('Hello');
  });

  it('returns html for rawhtml', () => {
    const result = sectionToHtml({
      kind: 'rawhtml',
      id: 's1',
      data: { html: '<h1>Raw</h1>' }
    });
    expect(result?.kind).toBe('rawhtml');
    expect(result?.html).toContain('<h1>Raw</h1>');
  });

  it('returns null for hero (non-html section)', () => {
    const result = sectionToHtml({
      kind: 'hero',
      id: 'h1',
      data: { title: 'X' }
    });
    expect(result).toBeNull();
  });

  it('returns null for cta', () => {
    const result = sectionToHtml({
      kind: 'cta',
      id: 'c1',
      data: { title: 'X', primaryLabel: 'G', primaryHref: '/x' }
    });
    expect(result).toBeNull();
  });
});

describe('deriveContentFromSections', () => {
  it('joins richtext sections with newlines', () => {
    const html = deriveContentFromSections([
      { kind: 'richtext', id: 'r1', data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }] } } },
      { kind: 'richtext', id: 'r2', data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'B' }] }] } } }
    ]);
    expect(html).toContain('A');
    expect(html).toContain('B');
  });

  it('preserves order of mixed richtext + rawhtml', () => {
    const html = deriveContentFromSections([
      { kind: 'richtext', id: 'r1', data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }] } } },
      { kind: 'rawhtml', id: 's1', data: { html: '<h1>Mid</h1>' } },
      { kind: 'richtext', id: 'r2', data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Last' }] }] } } }
    ]);
    const firstIdx = html.indexOf('First');
    const midIdx = html.indexOf('Mid');
    const lastIdx = html.indexOf('Last');
    expect(firstIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(lastIdx);
  });

  it('skips hero/cta/form/media/divider sections', () => {
    const html = deriveContentFromSections([
      { kind: 'hero', id: 'h1', data: { title: 'Hero' } },
      { kind: 'richtext', id: 'r1', data: { json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body' }] }] } } },
      { kind: 'divider', id: 'd1', data: {} }
    ]);
    expect(html).not.toContain('Hero');
    expect(html).toContain('Body');
  });

  it('returns empty string for non-html sections only', () => {
    const html = deriveContentFromSections([
      { kind: 'hero', id: 'h1', data: { title: 'H' } },
      { kind: 'cta', id: 'c1', data: { title: 'C', primaryLabel: 'X', primaryHref: '/x' } }
    ]);
    expect(html).toBe('');
  });
});
