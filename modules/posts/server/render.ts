// modules/posts/server/render.ts
// Server-side Tiptap renderer + sanitiser.
// content_json (Tiptap doc) → content_html (sanitised) + content_text (for FULLTEXT).

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

// Server-side extension bundle — same shape as client, but no Placeholder.
const SERVER_EXTENSIONS = [
  StarterKit.configure({}),
  Link.configure({ openOnClick: false }),
  Image.configure({ inline: false }),
  Youtube.configure({}),
  TableKit.configure({ table: {} }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Callout
];

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'figure',
    'figcaption',
    'blockquote',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'iframe',
    'aside',
    'span',
    'input'
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'target',
    'rel',
    'width',
    'height',
    'allow',
    'allowfullscreen',
    'frameborder',
    'data-callout',
    'data-tone',
    'data-type',
    'checked',
    'type',
    'disabled'
  ]
};

/** Render Tiptap doc JSON → sanitised HTML. */
export function jsonToHtml(contentJson: unknown): string {
  try {
    const raw = generateHTML(contentJson as never, SERVER_EXTENSIONS);
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  } catch {
    return '';
  }
}

/** Extract plain text from Tiptap doc for FULLTEXT indexing. */
export function jsonToText(contentJson: unknown): string {
  try {
    const html = generateHTML(contentJson as never, SERVER_EXTENSIONS);
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
  } catch {
    return '';
  }
}
