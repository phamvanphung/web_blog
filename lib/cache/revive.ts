// lib/cache/revive.ts
// `unstable_cache` (Next.js data cache) serializes values through JSON, which
// strips Date prototypes. After a cache hit, every Date field is a string —
// calling `.toISOString()` then throws "not a function".
//
// `reviveDates` walks a value and converts any string that matches the ISO
// date pattern back into a `Date`. Apply at the *boundary* of every
// `unstable_cache` wrapper that surfaces Date-typed fields to consumers.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

export function reviveDates<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => reviveDates(v)) as unknown as T;
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    if (ISO_DATE_RE.test(value)) return new Date(value) as unknown as T;
    return value;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = reviveDates(v);
    }
    return out as T;
  }
  return value;
}
