import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import type { Section } from './types';

// Allow-list mirrors modules/posts/server/render.ts PURIFY_CONFIG but slightly more
// permissive for landing pages (style attribute, data-* for section hooks).
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img', 'figure', 'figcaption', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'iframe', 'aside', 'span', 'input',
    'div', 'section', 'article', 'header', 'footer', 'main', 'nav',
    'button', 'label', 'form', 'select', 'option', 'textarea',
    'hr', 'small', 'sup', 'sub', 'mark', 'cite', 'q',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id',
    'target', 'rel', 'width', 'height',
    'allow', 'allowfullscreen', 'frameborder', 'loading',
    'data-*',
    'type', 'name', 'value', 'placeholder', 'required',
    'aria-*', 'role',
    'style', // landing pages often inline minor styling
  ],
};

const RawHtmlData = z.object({
  html: z.string().transform((s) => DOMPurify.sanitize(s, PURIFY_CONFIG)),
});

const RichTextData = z.object({ json: z.any() });
const HeroData = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
  mediaId: z.string().nullable().optional(),
});
const CtaData = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  primaryLabel: z.string().min(1).max(80),
  primaryHref: z.string().min(1).max(500),
  secondaryLabel: z.string().max(80).optional(),
  secondaryHref: z.string().max(500).optional(),
});
const FormData = z.object({
  formType: z.enum(['contact', 'newsletter']),
  heading: z.string().max(200).optional(),
  body: z.string().max(1000).optional(),
});
const MediaData = z.object({
  mediaId: z.string().min(1),
  layout: z.enum(['full', 'pair']),
  caption: z.string().max(400).optional(),
});
const DividerData = z.object({}).strict();

export const SectionSchema: z.ZodType<Section> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('richtext'), id: z.string(), data: RichTextData }),
  z.object({ kind: z.literal('hero'), id: z.string(), data: HeroData }),
  z.object({ kind: z.literal('cta'), id: z.string(), data: CtaData }),
  z.object({ kind: z.literal('form'), id: z.string(), data: FormData }),
  z.object({ kind: z.literal('media'), id: z.string(), data: MediaData }),
  z.object({ kind: z.literal('rawhtml'), id: z.string(), data: RawHtmlData }),
  z.object({ kind: z.literal('divider'), id: z.string(), data: DividerData }),
]);

export const SectionsArraySchema = z.array(SectionSchema).max(50);

export const SECTION_KINDS: Section['kind'][] = [
  'richtext', 'hero', 'cta', 'form', 'media', 'rawhtml', 'divider',
];
