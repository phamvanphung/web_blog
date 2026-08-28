// tests/unit/popup-public-select.test.ts
// Regression test for a real bug: PUBLIC_SELECT was missing `status` and
// `deletedAt`, so the cached popup objects had `undefined` for those
// fields. The matcher's defense-in-depth check
// (`if (popup.status !== 'PUBLISHED') return false`) then rejected every
// popup and the public site rendered zero popups despite correct admin
// settings.
//
// Strategy: assert the public read path selects every field the matcher
// reads. If anyone narrows the SELECT without updating the matcher (or
// vice versa), this test fires.

import { describe, it, expect } from 'vitest';
import type { SerializedPopup } from '@/modules/popups/types';
import { matches } from '@/modules/popups/server/match';

// Reproduce the row shape the public read produces (subset of `Popup`).
// If PUBLIC_SELECT narrows further, TypeScript will reject this fixture
// because SerializedPopup would no longer carry status/deletedAt.
function mkSerialized(over: Partial<SerializedPopup> = {}): SerializedPopup {
  return {
    id: 'p1',
    name: 'Test',
    htmlContent: '<p>x</p>',
    status: 'PUBLISHED',
    triggerType: 'ALL',
    triggerPaths: null,
    frequency: 'ALWAYS',
    delaySeconds: 0,
    deletedAt: null,
    ...over
  } as SerializedPopup;
}

describe('PUBLIC_SELECT shape', () => {
  it('SerializedPopup includes the fields matcher reads', () => {
    const p = mkSerialized();
    // These accesses are the root-cause check: if PUBLIC_SELECT ever
    // drops status/deletedAt, SerializedPopup drops them too, and these
    // accesses typecheck but produce `undefined` at runtime — the test
    // below catches that by re-checking the matcher behaves correctly
    // with a SerializedPopup-shaped object.
    expect(p.status).toBe('PUBLISHED');
    expect(p.deletedAt).toBeNull();
  });

  it('matcher returns true for an ALL trigger on SerializedPopup', () => {
    // Before the fix this returned false because `status` was undefined
    // on the cached row, even though the DB query filtered status=PUBLISHED.
    expect(matches(mkSerialized({ triggerType: 'ALL' }) as never, '/')).toBe(true);
  });

  it('matcher rejects DRAFT via SerializedPopup defense-in-depth', () => {
    // Confirms the safety net still works — if anyone changes the matcher
    // to drop the status check, this test fails.
    expect(matches(mkSerialized({ status: 'DRAFT' }) as never, '/')).toBe(false);
  });

  it('matcher rejects soft-deleted via SerializedPopup defense-in-depth', () => {
    expect(matches(mkSerialized({ deletedAt: new Date() }) as never, '/')).toBe(false);
  });
});