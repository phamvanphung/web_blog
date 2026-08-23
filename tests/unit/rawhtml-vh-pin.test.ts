// tests/unit/rawhtml-vh-pin.test.ts
//
// Regression tests for the vh-pin guard inside <RawHtmlBlock>. The guard
// is what stops pasted landing pages with `min-height: 100vh` (and
// friends) from driving a feedback loop that pins body height at
// Chromium's 2^25 ceiling.
//
// Earlier revisions of the guard only matched declarations that were
// *purely* `<number>vh`. That missed `calc(100vh - 52px)`,
// `min(100vh, 800px)`, and any other mixed expression — the exact
// shape that triggered the 33 554 432 px body height on the
// /dulichvietnam page. These tests pin the helper to handle every
// reasonable shape of vh-bearing value the guard might encounter.

import { describe, it, expect } from 'vitest';
import { replaceVhUnits } from '@/components/site/blocks/vhPin';

describe('replaceVhUnits', () => {
  // ---- pure vh -------------------------------------------------------

  it('pins "100vh" to the viewport pixel height', () => {
    expect(replaceVhUnits('100vh', 911)).toBe('911px');
  });

  it('handles fractional vh values', () => {
    // 12.5vh of 800 = 100
    expect(replaceVhUnits('12.5vh', 800)).toBe('100px');
  });

  it('handles negative vh values', () => {
    // -50vh of 1000 = -500
    expect(replaceVhUnits('-50vh', 1000)).toBe('-500px');
  });

  it('handles vh with whitespace around the number', () => {
    // CSS allows whitespace inside the value but not inside the token;
    // browsers will normalize "100  vh" to "100vh" so the regex still
    // matches. We just verify the common "100vh " trailing-space form
    // is replaced in-place.
    expect(replaceVhUnits('100vh ', 911)).toBe('911px ');
  });

  // ---- mixed expressions (the regression) ---------------------------

  it('rewrites vh inside calc(...)', () => {
    // This is the exact pattern that broke /dulichvietnam.
    expect(replaceVhUnits('calc(100vh - 52px)', 911)).toBe(
      'calc(911px - 52px)'
    );
  });

  it('rewrites vh inside min(...) and max(...)', () => {
    expect(replaceVhUnits('min(100vh, 800px)', 1000)).toBe(
      'min(1000px, 800px)'
    );
    expect(replaceVhUnits('max(100vh, 800px)', 1000)).toBe(
      'max(1000px, 800px)'
    );
  });

  it('rewrites vh multiplied by a scalar inside calc()', () => {
    expect(replaceVhUnits('calc(100vh - 4rem)', 800)).toBe(
      'calc(800px - 4rem)'
    );
  });

  it('rewrites multiple vh tokens in the same value', () => {
    expect(replaceVhUnits('calc(100vh - 50vh)', 800)).toBe(
      'calc(800px - 400px)'
    );
  });

  // ---- pass-through --------------------------------------------------

  it('leaves values without vh unchanged', () => {
    expect(replaceVhUnits('200px', 911)).toBe('200px');
    expect(replaceVhUnits('1rem solid #000', 911)).toBe('1rem solid #000');
    expect(replaceVhUnits('', 911)).toBe('');
  });

  it('does not chew suffixes off adjacent non-vh tokens', () => {
    // "1vh1" is not a legal CSS value but the regex should still leave
    // it alone — `\b` stops the match before the trailing digit.
    expect(replaceVhUnits('1vh1', 800)).toBe('1vh1');
  });

  // ---- guards --------------------------------------------------------

  it('returns the original value when viewportPx is 0 / negative / NaN', () => {
    expect(replaceVhUnits('100vh', 0)).toBe('100vh');
    expect(replaceVhUnits('100vh', -1)).toBe('100vh');
    expect(replaceVhUnits('100vh', Number.NaN)).toBe('100vh');
    expect(replaceVhUnits('100vh', Number.POSITIVE_INFINITY)).toBe('100vh');
  });
});
