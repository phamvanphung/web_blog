// lib/slug.ts
// URL-safe slug + uniqueness. Vietnamese-friendly via NFD + diacritic strip.

const DIACRITIC_MAP: Record<string, string> = {
  đ: 'd',
  Đ: 'd'
  // NFD decomposition handles most others (à → a + `); we just
  // need to drop the combining marks afterwards.
};

/** Strip Vietnamese diacritics + lowercase + non-alphanumeric → hyphen. */
export function slugify(input: string): string {
  const replaced = input.replace(/[đĐ]/g, (m) => DIACRITIC_MAP[m] ?? m);
  const stripped = replaced.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * Append "-2", "-3", … until `exists(slug)` is false. The caller passes
 * a DB-aware async predicate (e.g. `(s) => db.post.findUnique({where:{slug:s}}).then(Boolean)`).
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`ensureUniqueSlug: exhausted suffixes for "${base}"`);
}
