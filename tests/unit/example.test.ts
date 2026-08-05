import { describe, it, expect } from 'vitest';
import { buildMetadata } from '@/lib/seo';

describe('buildMetadata', () => {
  it('returns title + description', () => {
    const m = buildMetadata({ title: 'T', description: 'D' });
    expect(m.title).toBe('T');
    expect((m as { description?: string }).description).toBe('D');
  });

  it('sets noindex when requested', () => {
    const m = buildMetadata({ title: 'T', description: 'D', noindex: true });
    expect(m.robots).toEqual({ index: false, follow: false });
  });
});
