import { describe, expect, it } from 'vitest';
import { filterSlashItems, type SlashItem } from '@/components/editor/slashItems';

const sample: SlashItem[] = [
  { id: 'h1',     group: 'Text',    label: 'Heading 1', keywords: ['title', 'h1'] },
  { id: 'bullet', group: 'Text',    label: 'Bullet list', keywords: ['ul', 'list'] },
  { id: 'image',  group: 'Media',   label: 'Image',       keywords: ['photo', 'picture'] },
  { id: 'video',  group: 'Media',   label: 'Video',       keywords: ['youtube', 'vimeo'] },
  { id: 'divider',group: 'Layout',  label: 'Divider',     keywords: ['hr', 'line'] },
  { id: 'callout-info', group: 'Layout', label: 'Callout (Info)', keywords: ['note', 'info'] },
];

describe('filterSlashItems', () => {
  it('returns grouped list unchanged when query is empty', () => {
    const out = filterSlashItems(sample, '', 8);
    expect(out).toHaveLength(6);
    // expect first item in each group present, in declared order
    expect(out.find((i) => i.id === 'h1')).toBeDefined();
    expect(out.find((i) => i.id === 'image')).toBeDefined();
    expect(out.find((i) => i.id === 'divider')).toBeDefined();
  });

  it('matches by label substring (case-insensitive)', () => {
    const out = filterSlashItems(sample, 'HEAD', 8);
    expect(out.map((i) => i.id)).toContain('h1');
  });

  it('matches by keyword', () => {
    const out = filterSlashItems(sample, 'youtube', 8);
    expect(out.map((i) => i.id)).toContain('video');
  });

  it('respects the limit', () => {
    const out = filterSlashItems(sample, '', 2);
    expect(out).toHaveLength(2);
  });

  it('returns empty array when nothing fits', () => {
    const out = filterSlashItems(sample, 'zzz', 8);
    expect(out).toEqual([]);
  });

  it('ranks label-prefix matches above keyword matches', () => {
    // "Heading 1" starts with "hea"; also "Header" would match if present.
    // Test that label-substring beats keyword-only matches.
    const out = filterSlashItems(sample, 'h', 8);
    const firstH1 = out.findIndex((i) => i.id === 'h1');
    const firstNotH1 = out.findIndex((i) => i.id !== 'h1');
    expect(firstH1).toBeGreaterThanOrEqual(0);
    // h1 should appear before any unrelated item
    if (firstNotH1 >= 0) expect(firstH1).toBeLessThan(firstNotH1);
  });
});
