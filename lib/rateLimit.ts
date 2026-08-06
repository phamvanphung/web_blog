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

/**
 * Bucket-keyed sliding-window rate limit. One limiter per bucket is cached
 * for the lifetime of the process — windowMs is taken from the first call
 * for that bucket (subsequent calls must use the same window).
 *
 * Returns ok=false + retryAfterSec when the bucket is over its limit.
 */
const BUCKET_LIMITERS = new Map<string, Limiter>();

export type RateLimitOpts = {
  bucket: string;
  key: string;
  limit: number;
  windowSec: number;
};

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function rateLimit(opts: RateLimitOpts): RateLimitResult {
  const { bucket, key, limit, windowSec } = opts;
  let limiter = BUCKET_LIMITERS.get(bucket);
  if (!limiter) {
    limiter = createLimiter({ max: limit, windowMs: windowSec * 1000 });
    BUCKET_LIMITERS.set(bucket, limiter);
  }
  const compositeKey = `${bucket}:${key}`;
  if (!limiter.check(compositeKey)) {
    return { ok: false, retryAfterSec: windowSec };
  }
  limiter.record(compositeKey);
  return { ok: true };
}

/** Test helper: clear all bucket state. */
export function resetAllLimiters(): void {
  for (const l of BUCKET_LIMITERS.values()) l.reset();
  BUCKET_LIMITERS.clear();
}
