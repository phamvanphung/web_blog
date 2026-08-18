export type SlashGroup = 'Text' | 'Media' | 'Layout' | 'Advanced';

export type SlashItem = {
  id: string;
  group: SlashGroup;
  label: string;
  keywords: string[];
  // command is supplied by the consumer (EditorCanvas) at render time
  // to keep this module pure + unit-testable.
  command?: never;
};

const ALL: SlashItem[] = [
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

function score(item: SlashItem, q: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const label = item.label.toLowerCase();
  if (label.startsWith(ql)) return 100;
  if (label.includes(ql)) return 60;
  if (item.keywords.some((k) => k.toLowerCase().startsWith(ql))) return 40;
  if (item.keywords.some((k) => k.toLowerCase().includes(ql))) return 20;
  return -1;
}

/**
 * Filter `items` by fuzzy match against `label` and `keywords`. Returns up to
 * `limit` results, ranked by score (highest first) then group order.
 * Pure: no React, no editor — used both by SlashMenu.tsx and unit tests.
 */
export function filterSlashItems(items: SlashItem[], query: string, limit: number): SlashItem[] {
  if (!query) return items.slice(0, limit);
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

export const SLASH_ITEMS: SlashItem[] = ALL;
