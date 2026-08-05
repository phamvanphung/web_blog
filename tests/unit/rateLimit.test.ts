import { describe, it, expect, beforeEach } from 'vitest';
import { createLimiter } from '@/lib/rateLimit';

describe('rate limiter', () => {
  beforeEach(() => {
    // Each test gets its own limiter (no shared in-memory state).
  });

  it('allows up to N attempts, then blocks', () => {
    const lim = createLimiter({ max: 3, windowMs: 1000 });
    expect(lim.check('k')).toBe(true);
    lim.record('k');
    expect(lim.check('k')).toBe(true);
    lim.record('k');
    expect(lim.check('k')).toBe(true);
    lim.record('k');
    expect(lim.check('k')).toBe(false);
  });

  it('resets after window passes', async () => {
    const lim = createLimiter({ max: 2, windowMs: 50 });
    lim.record('k');
    lim.record('k');
    expect(lim.check('k')).toBe(false);
    await new Promise((r) => setTimeout(r, 80));
    expect(lim.check('k')).toBe(true);
  });

  it('isolates keys', () => {
    const lim = createLimiter({ max: 1, windowMs: 1000 });
    lim.record('a');
    expect(lim.check('a')).toBe(false);
    expect(lim.check('b')).toBe(true);
  });
});
