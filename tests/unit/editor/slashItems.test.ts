import { describe, expect, it } from 'vitest';
import {
  filterSlashItems,
  score,
  type SlashItem,
} from '@/components/editor/slashItems';

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

  it('returns all items on empty query regardless of limit (limit only applies to filtered results)', () => {
    // Empty query is the "I just typed /, show me everything" state — slicing
    // would hide entire groups the user doesn't know exist.
    const out = filterSlashItems(sample, '', 2);
    expect(out).toHaveLength(sample.length);
  });

  it('treats whitespace-only query the same as empty query', () => {
    const empty = filterSlashItems(sample, '', 8);
    const blank = filterSlashItems(sample, '   ', 8);
    expect(blank).toEqual(empty);
  });

  it('sorts even on empty query by GROUP_ORDER (Text, Media, Layout, Advanced)', () => {
    const out = filterSlashItems(sample, '', 8);
    // First item must be Text, then Media, then Layout. (No Advanced in sample.)
    expect(out[0]!.group).toBe('Text');
    const textBoundary = out.findIndex((i) => i.group !== 'Text');
    expect(textBoundary).toBeGreaterThan(0);
    expect(out[textBoundary]!.group).toBe('Media');
    const mediaBoundary = out.findIndex((i) => i.group !== 'Text' && i.group !== 'Media');
    expect(mediaBoundary).toBeGreaterThan(textBoundary);
    expect(out[mediaBoundary]!.group).toBe('Layout');
  });

  it('matches by label substring (case-insensitive)', () => {
    const out = filterSlashItems(sample, 'HEAD', 8);
    expect(out.map((i) => i.id)).toContain('h1');
  });

  it('matches by keyword (case-insensitive)', () => {
    const out = filterSlashItems(sample, 'YOUTUBE', 8);
    expect(out.map((i) => i.id)).toContain('video');
  });

  it('respects the limit when query is non-empty', () => {
    const out = filterSlashItems(sample, 'i', 2);
    expect(out).toHaveLength(2);
  });

  it('returns empty array when limit is 0 (filtered results only)', () => {
    // Limit 0 only applies once the user has typed something to filter by —
    // empty query is the "show me everything" state and ignores the limit.
    const out = filterSlashItems(sample, 'h', 0);
    expect(out).toEqual([]);
  });

  it('caps results at items.length when limit exceeds available matches', () => {
    const out = filterSlashItems(sample, 'i', 100);
    // All sample labels contain 'i'; expect every item returned, capped naturally.
    expect(out).toHaveLength(sample.length);
  });

  it('returns empty array when nothing fits', () => {
    const out = filterSlashItems(sample, 'zzz', 8);
    expect(out).toEqual([]);
  });

  it('label-substring beats keyword-substring (ranks label-substring above keyword matches)', () => {
    // "Heading 1" contains 'h' as a substring (score 60), and "hr" keyword on
    // Divider also contains 'h' as a substring (score 20). h1 must rank higher.
    const out = filterSlashItems(sample, 'h', 8);
    const firstH1 = out.findIndex((i) => i.id === 'h1');
    const firstDivider = out.findIndex((i) => i.id === 'divider');
    expect(firstH1).toBeGreaterThanOrEqual(0);
    expect(firstDivider).toBeGreaterThanOrEqual(0);
    expect(firstH1).toBeLessThan(firstDivider);
  });

  it('label-prefix beats keyword-prefix when both apply', () => {
    // 'hea' is a label-prefix for 'Heading 1' (100) and would only match via
    // label; no keyword in sample starts with 'hea'. Confirm h1 ranks first.
    const out = filterSlashItems(sample, 'hea', 8);
    expect(out[0]!.id).toBe('h1');
  });

  it('breaks ties by GROUP_ORDER', () => {
    // 'i' matches every item as a substring. They all share the lowest tier
    // (SCORE_KEYWORD_CONTAINS=20 or SCORE_LABEL_CONTAINS=60). Among those with
    // identical scores, GROUP_ORDER should determine order.
    const out = filterSlashItems(sample, 'i', 100);
    // Find the first tier with duplicates and verify GROUP_ORDER ordering there.
    const tierGroups: SlashItem[][] = [];
    for (const item of out) {
      const s = score(item, 'i');
      let bucket = tierGroups.find((g) => score(g[0]!, 'i') === s);
      if (!bucket) {
        bucket = [];
        tierGroups.push(bucket);
      }
      bucket.push(item);
    }
    const tiedBucket = tierGroups.find((g) => g.length > 1);
    expect(tiedBucket).toBeDefined();
    const groups = tiedBucket!.map((i) => i.group);
    const indices = groups.map((g) => ['Text', 'Media', 'Layout', 'Advanced'].indexOf(g));
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
  });

  it('SlashItem has no command field at compile time', () => {
    // Compile-time check: this assignment fails type-check if `command` ever
    // re-appears on SlashItem.
    const item: SlashItem = {
      id: 'x',
      group: 'Text',
      label: 'X',
      keywords: [],
    };
    expect(item).not.toHaveProperty('command');
  });
});

describe('score', () => {
  const heading: SlashItem = { id: 'h1', group: 'Text', label: 'Heading 1', keywords: ['title'] };
  const video: SlashItem = { id: 'v', group: 'Media', label: 'Video', keywords: ['youtube'] };
  const divider: SlashItem = { id: 'd', group: 'Layout', label: 'Divider', keywords: ['hr'] };

  it('returns label-prefix score for label that starts with query', () => {
    expect(score(heading, 'head')).toBe(100);
  });

  it('returns label-contains score for label substring match', () => {
    expect(score(heading, 'ading')).toBe(60);
  });

  it('returns keyword-prefix score when a keyword starts with query', () => {
    expect(score(video, 'you')).toBe(40);
  });

  it('returns keyword-contains score when a keyword contains query', () => {
    expect(score(video, 'tube')).toBe(20);
  });

  it('returns -1 for no match', () => {
    expect(score(divider, 'zzz')).toBe(-1);
  });

  it('returns 0 for empty query', () => {
    expect(score(heading, '')).toBe(0);
  });
});