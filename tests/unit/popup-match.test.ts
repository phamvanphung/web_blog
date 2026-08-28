// tests/unit/popup-match.test.ts
// Pure matcher for popup trigger rules. No DB.

import { describe, it, expect } from 'vitest';
import { matches } from '@/modules/popups/server/match';
import type { Popup } from '@prisma/client';

function mk(over: Partial<Popup> = {}): Popup {
  return {
    id: 'p1',
    name: 'Test',
    htmlContent: '<p>x</p>',
    triggerType: 'ALL',
    triggerPaths: null,
    frequency: 'ALWAYS',
    delaySeconds: 0,
    status: 'PUBLISHED',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over
  } as Popup;
}

describe('matches', () => {
  it('returns false for DRAFT popups', () => {
    expect(matches(mk({ status: 'DRAFT' }), '/')).toBe(false);
  });

  it('returns false for soft-deleted popups', () => {
    expect(matches(mk({ deletedAt: new Date() }), '/')).toBe(false);
  });

  it('ALL trigger matches every pathname', () => {
    expect(matches(mk({ triggerType: 'ALL' }), '/')).toBe(true);
    expect(matches(mk({ triggerType: 'ALL' }), '/about')).toBe(true);
    expect(matches(mk({ triggerType: 'ALL' }), '/blog/some-post')).toBe(true);
  });

  it('HOMEPAGE trigger matches only "/"', () => {
    expect(matches(mk({ triggerType: 'HOMEPAGE' }), '/')).toBe(true);
    expect(matches(mk({ triggerType: 'HOMEPAGE' }), '/about')).toBe(false);
    expect(matches(mk({ triggerType: 'HOMEPAGE' }), '/index.html')).toBe(false);
  });

  it('PATH trigger matches when pathname is in triggerPaths array', () => {
    const p = mk({ triggerType: 'PATH', triggerPaths: ['/about', '/contact'] });
    expect(matches(p, '/about')).toBe(true);
    expect(matches(p, '/contact')).toBe(true);
    expect(matches(p, '/other')).toBe(false);
  });

  it('PATH trigger returns false when triggerPaths is null', () => {
    const p = mk({ triggerType: 'PATH', triggerPaths: null });
    expect(matches(p, '/about')).toBe(false);
  });

  it('PATH trigger returns false when triggerPaths is not an array', () => {
    const p = mk({ triggerType: 'PATH', triggerPaths: 'oops' as unknown as null });
    expect(matches(p, '/about')).toBe(false);
  });

  it('PATH trigger does not match partial paths', () => {
    const p = mk({ triggerType: 'PATH', triggerPaths: ['/blog'] });
    expect(matches(p, '/blog')).toBe(true);
    expect(matches(p, '/blog/post-1')).toBe(false);
    expect(matches(p, '/blogXyz')).toBe(false);
  });
});
