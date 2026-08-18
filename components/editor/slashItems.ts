export type SlashGroup = 'Text' | 'Media' | 'Layout' | 'Advanced';

/**
 * Pure-data descriptor for a slash-menu entry. Intentionally carries NO command
 * or runtime behaviour — this keeps the catalog trivially serializable, free of
 * React/Tiptap imports, and easy to unit-test in isolation.
 *
 * Consumers (e.g. EditorCanvas) are responsible for building their own map
 * keyed by `id` that wires each item to its Tiptap command at render time.
 */
export type SlashItem = {
  id: string;
  group: SlashGroup;
  label: string;
  keywords: string[];
};

// Fuzzy-match scoring tiers. Higher = better. Used by `score()` below and
// exposed for unit tests.
export const SCORE_LABEL_PREFIX = 100;
export const SCORE_LABEL_CONTAINS = 60;
export const SCORE_KEYWORD_PREFIX = 40;
export const SCORE_KEYWORD_CONTAINS = 20;

/**
 * Compute the fuzzy-match score for an item against a (lowercased) query.
 * Comparison is naive byte-equality — sufficient for English/Vietnamese UI;
 * locale-sensitive matches would need Intl.Collator.
 *
 * Returns -1 for "no match" so callers can filter with `score >= 0`.
 */
export function score(item: SlashItem, q: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const label = item.label.toLowerCase();
  if (label.startsWith(ql)) return SCORE_LABEL_PREFIX;
  if (label.includes(ql)) return SCORE_LABEL_CONTAINS;
  if (item.keywords.some((k) => k.toLowerCase().startsWith(ql))) return SCORE_KEYWORD_PREFIX;
  if (item.keywords.some((k) => k.toLowerCase().includes(ql))) return SCORE_KEYWORD_CONTAINS;
  return -1;
}

export const SLASH_ITEMS: SlashItem[] = [
  { id: 'paragraph',   group: 'Text',    label: 'Paragraph',     keywords: ['text', 'p'] },
  { id: 'h1',          group: 'Text',    label: 'Heading 1',     keywords: ['title', 'h1'] },
  { id: 'h2',          group: 'Text',    label: 'Heading 2',     keywords: ['subtitle', 'h2'] },
  { id: 'h3',          group: 'Text',    label: 'Heading 3',     keywords: ['h3'] },
  { id: 'bullet',      group: 'Text',    label: 'Bullet list',   keywords: ['ul', 'list', 'unordered'] },
  { id: 'ordered',     group: 'Text',    label: 'Numbered list', keywords: ['ol', 'numbered'] },
  { id: 'todo',        group: 'Text',    label: 'Todo list',     keywords: ['task', 'checklist'] },
  { id: 'quote',       group: 'Text',    label: 'Quote',         keywords: ['blockquote', 'cite'] },
  { id: 'code',        group: 'Text',    label: 'Code block',    keywords: ['pre', 'snippet'] },
  { id: 'image',       group: 'Media',   label: 'Image',         keywords: ['photo', 'picture', 'img'] },
  { id: 'video',       group: 'Media',   label: 'Video',         keywords: ['youtube', 'vimeo', 'movie'] },
  { id: 'embed',       group: 'Media',   label: 'Embed',         keywords: ['iframe', 'link'] },
  { id: 'divider',     group: 'Layout',  label: 'Divider',       keywords: ['hr', 'line', 'rule'] },
  { id: 'callout-info',group: 'Layout',  label: 'Callout (Info)',keywords: ['note', 'info'] },
  { id: 'callout-warn',group: 'Layout',  label: 'Callout (Warn)',keywords: ['warning', 'caution'] },
  { id: 'table',       group: 'Advanced',label: 'Table',         keywords: ['grid', 'rows'] },
];

const GROUP_ORDER: SlashGroup[] = ['Text', 'Media', 'Layout', 'Advanced'];

/**
 * Filter `items` by fuzzy match against `label` and `keywords`. Returns up to
 * `limit` results, ranked by score (highest first) then group order.
 * Pure: no React, no editor — used both by SlashMenu.tsx and unit tests.
 */
export function filterSlashItems(items: SlashItem[], query: string, limit: number): SlashItem[] {
  // Whitespace-only query is treated the same as empty — no item can score
  // positive, and "   " should not slip past as a falsy-but-meaningful string.
  if (!query.trim()) {
    // Even on an empty query, run items through a stable GROUP_ORDER sort so
    // the menu is predictable rather than dependent on declaration order.
    return [...items]
      .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
      .slice(0, limit);
  }
  const scored = items
    .map((it) => ({ it, s: score(it, query) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return GROUP_ORDER.indexOf(a.it.group) - GROUP_ORDER.indexOf(b.it.group);
    })
    .slice(0, limit)
    .map((x) => x.it);
  return scored;
}