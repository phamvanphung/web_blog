// modules/pages/server/render.ts
// Server-side Tiptap renderer + sanitiser for Page sections.

import { generateHTML } from '@tiptap/html/server';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import DOMPurify from 'isomorphic-dompurify';
import { Callout } from '../../../components/editor/nodes/Callout';
import { Embed } from '../../../components/editor/nodes/Embed';
import type { Section } from '../types';

// Server-side extension bundle — mirrors modules/posts/server/render.ts SERVER_EXTENSIONS.
// No Placeholder / BubbleMenu / GlobalDragHandle / SlashCommandExtension (client-only).
const SERVER_EXTENSIONS = [
  StarterKit.configure({}),
  Link.configure({ openOnClick: false }),
  Image.configure({ inline: false }),
  Youtube.configure({}),
  TableKit.configure({ table: {} }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Callout,
  Embed,
];

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img', 'figure', 'figcaption', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'iframe', 'aside', 'span', 'input',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
    'width', 'height', 'allow', 'allowfullscreen', 'frameborder',
    'loading', 'data-callout', 'data-tone', 'data-type',
    'checked', 'type', 'disabled',
  ],
};

export type SectionHtml =
  | { kind: 'richtext'; html: string }
  | { kind: 'rawhtml'; html: string };

/** Convert a richtext or rawhtml section into sanitised HTML. */
export function sectionToHtml(section: Section): SectionHtml | null {
  if (section.kind === 'richtext') {
    const raw = generateHTML(section.data.json as never, SERVER_EXTENSIONS);
    return { kind: 'richtext', html: DOMPurify.sanitize(raw, PURIFY_CONFIG) };
  }
  if (section.kind === 'rawhtml') {
    // Already sanitised at save time (Zod transform in schema.ts)
    return { kind: 'rawhtml', html: section.data.html };
  }
  return null;
}

/**
 * Derive the legacy `Page.content` longtext from the section list.
 * Concatenates only richtext + rawhtml sections, in order, joined by \n\n.
 * Used for the deprecated `content` column during the migration window.
 */
export function deriveContentFromSections(sections: Section[]): string {
  return sections
    .map((s) => sectionToHtml(s))
    .filter((x): x is SectionHtml => x !== null)
    .map((x) => x.html)
    .join('\n\n');
}
