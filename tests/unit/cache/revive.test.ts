// tests/unit/cache/revive.test.ts
// Pins behaviour of the JSON-deserialization shim used by every
// `unstable_cache` wrapper. Regression gate for the
// `p.updatedAt.toISOString is not a function` CMS bug.

import { describe, expect, it } from 'vitest';
import { reviveDates } from '@/lib/cache/revive';

type Row = { id: string; updatedAt: Date | string };

describe('reviveDates', () => {
  it('passes null and undefined through unchanged', () => {
    expect(reviveDates(null)).toBeNull();
    expect(reviveDates(undefined)).toBeUndefined();
  });

  it('leaves Date instances alone', () => {
    const d = new Date('2024-01-02T03:04:05.000Z');
    expect(reviveDates(d)).toBe(d);
    expect(reviveDates(d)).toBeInstanceOf(Date);
  });

  it('leaves plain non-date strings alone', () => {
    expect(reviveDates('hello')).toBe('hello');
    expect(reviveDates('2024-01-02')).toBe('2024-01-02'); // date-only, not ISO datetime
  });

  it('converts ISO datetime strings to Date', () => {
    const iso = '2024-01-02T03:04:05.000Z';
    const result = reviveDates(iso) as unknown as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe(iso);
  });

  it('handles ISO strings with a numeric timezone offset', () => {
    const iso = '2024-01-02T03:04:05+07:00';
    const result = reviveDates(iso) as unknown as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2024-01-01T20:04:05.000Z');
  });

  it('revives dates inside arrays', () => {
    const rows: Row[] = [
      { id: 'a', updatedAt: '2024-01-02T03:04:05.000Z' },
      { id: 'b', updatedAt: '2024-02-03T04:05:06.000Z' }
    ];
    const out = reviveDates(rows);
    expect(out).toHaveLength(2);
    const [first, second] = out;
    expect(first?.updatedAt).toBeInstanceOf(Date);
    expect(second?.updatedAt).toBeInstanceOf(Date);
    expect((first?.updatedAt as Date).toISOString()).toBe('2024-01-02T03:04:05.000Z');
  });

  it('revives dates inside nested objects', () => {
    const value = {
      id: 'a',
      meta: { createdAt: '2024-01-02T03:04:05.000Z', count: 7 },
      tags: [{ at: '2024-03-04T05:06:07.000Z', name: 'x' }]
    };
    const out = reviveDates(value);
    expect(out.meta.createdAt).toBeInstanceOf(Date);
    const [firstTag] = out.tags;
    expect(firstTag?.at).toBeInstanceOf(Date);
    expect(out.meta.count).toBe(7); // non-date scalars preserved as-is
  });

  it('does not mutate the input shape', () => {
    const input = {
      updatedAt: '2024-01-02T03:04:05.000Z',
      children: [{ updatedAt: '2024-02-03T04:05:06.000Z' }]
    };
    const out = reviveDates(input);
    expect(out).not.toBe(input);
    expect(input.updatedAt).toBe('2024-01-02T03:04:05.000Z'); // unchanged
    expect(out.updatedAt).toBeInstanceOf(Date);
  });

  it('preserves Date instances found inside arrays/objects without re-wrapping', () => {
    const d = new Date('2024-05-06T07:08:09.000Z');
    const value: { items: (Date | { at: Date })[] } = { items: [d, { at: d }] };
    const out = reviveDates(value);
    const [first, second] = out.items;
    expect(first).toBe(d); // identity preserved
    expect(second).toBeDefined();
    if (second && !(second instanceof Date)) {
      expect(second.at).toBe(d);
    }
  });
});