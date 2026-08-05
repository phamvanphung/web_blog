// lib/rateLimit.ts
// Sliding-window in-memory rate limiter.
//
// P1: in-memory is fine for a single-process deploy. Document that this
// resets across restarts and doesn't share state across instances.
// P5+/deploy: replace with Redis or DB-backed limiter.

export type LimiterOpts = { max: number; windowMs: number };
export type Limiter = {
  /** Returns true if a new attempt would be allowed right now. */
  check(key: string): boolean;
  /** Records an attempt for `key` at the current timestamp. */
  record(key: string): void;
  /** Resets all state. Useful for tests. */
  reset(): void;
};

export function createLimiter(opts: LimiterOpts): Limiter {
  const timestamps = new Map<string, number[]>();
  const now = () => Date.now();

  return {
    check(key) {
      const arr = timestamps.get(key) ?? [];
      const cutoff = now() - opts.windowMs;
      const live = arr.filter((t) => t > cutoff);
      timestamps.set(key, live);
      return live.length < opts.max;
    },
    record(key) {
      const arr = timestamps.get(key) ?? [];
      arr.push(now());
      timestamps.set(key, arr);
    },
    reset() {
      timestamps.clear();
    }
  };
}
