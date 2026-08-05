import { describe, it, expect } from 'vitest';
import { jsonToHtml, jsonToText } from '@/modules/posts/server/render';

describe('jsonToHtml', () => {
  it('renders simple paragraph', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }]
    };
    expect(jsonToHtml(doc)).toContain('<p>hello</p>');
  });

  it('renders bold via marks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'bold here' }]
        }
      ]
    };
    const html = jsonToHtml(doc);
    expect(html).toContain('<strong>bold here</strong>');
  });

  it('strips dangerous script tags from html', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'safe' }] }]
    };
    const html = jsonToHtml(doc);
    expect(html).not.toContain('<script');
  });

  it('returns empty string on invalid JSON', () => {
    expect(jsonToHtml({ invalid: true })).toBe('');
  });
});

describe('jsonToText', () => {
  it('extracts plain text for search index', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Xin chào' }] }]
    };
    expect(jsonToText(doc)).toContain('Xin chào');
  });

  it('returns empty string for empty doc', () => {
    expect(jsonToText({ type: 'doc', content: [] })).toBe('');
  });
});