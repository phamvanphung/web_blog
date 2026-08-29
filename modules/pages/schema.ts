import { z } from 'zod';
import type { Section } from './types';

// RawHTML is the admin escape hatch for landing pages. The trust context is
// narrow: only site admins (role=ADMIN) can write RawHTML sections, and they
// already have full DB + file-system access. So we trade DOMPurify's
// "strip everything dangerous" posture for a minimal sanitiser that only
// removes the XSS vectors we actually care about, while leaving CSS / JS
// (which DOMPurify strips by default) intact.
//
// We keep DOMPurify available for the public-render path (server/render.ts)
// where untrusted richtext needs strict sanitisation. Here in the schema we
// use a small custom pass that's known-good for our needs.

/**
 * Minimal RawHTML sanitiser. Strips only the XSS vectors we care about:
 *   - inline event handlers (`onclick`, `onerror`, `onload`, …)
 *   - `javascript:` / `vbscript:` URLs in `href`, `src`, `xlink:href`,
 *     `formaction`, `background`
 *
 * Does NOT strip `<style>`, `<link>`, `<script>`, `<iframe>`, `<svg>` —
 * those are legitimate landing-page primitives the admin is using.
 */
function sanitizeRawHtml(input: string): string {
  let safe = input;
  // `on*="..."` / `on*='...'` / `on*=...` (unquoted)
  safe = safe.replace(
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ''
  );
  // `href="javascript:..."` / `src="javascript:..."` etc.
  safe = safe.replace(
    /(\s(?:href|src|xlink:href|formaction|background)\s*=\s*["']?)javascript:[^"'\s>]*/gi,
    '$1#'
  );
  safe = safe.replace(
    /(\s(?:href|src|xlink:href|formaction|background)\s*=\s*["']?)vbscript:[^"'\s>]*/gi,
    '$1#'
  );
  return safe;
}

const RawHtmlData = z.object({
  html: z.string().max(100_000).transform(sanitizeRawHtml),
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

const CategoryLayoutSchema = z.enum(['grid-2', 'grid-3', 'grid-4']);
const CategoryOrderSchema = z.enum(['sortOrder', 'name']);

const CategoriesData = z.object({
  groupSlug: z.string().min(1),
  heading: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  layout: CategoryLayoutSchema.default('grid-3'),
  limit: z.number().int().min(1).max(48).default(12),
  showAll: z.boolean().default(false),
  orderBy: CategoryOrderSchema.default('sortOrder')
});

const CategoriesSectionSchema = z.object({
  kind: z.literal('categories'),
  id: z.string(),
  data: CategoriesData
});

const PostsLayoutSchema = z.enum(['list', 'grid']);
const PostsGridColsSchema = z.union([z.literal(2), z.literal(3), z.literal(4)]);

const PostsData = z.object({
  groupSlug: z.string().optional(),
  heading: z.string().max(200).optional(),
  layout: PostsLayoutSchema.default('list'),
  // Limit caps at 48 to mirror listPublishedPosts; rows × cols must fit.
  limit: z.number().int().min(1).max(48).default(6),
  cols: PostsGridColsSchema.default(3),
  showImage: z.boolean().default(true),
  showTitle: z.boolean().default(true),
  showExcerpt: z.boolean().default(false)
});

const PostsSectionSchema = z.object({
  kind: z.literal('posts'),
  id: z.string(),
  data: PostsData
});

export const SectionSchema: z.ZodType<Section> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('richtext'), id: z.string(), data: RichTextData }),
  z.object({ kind: z.literal('hero'), id: z.string(), data: HeroData }),
  z.object({ kind: z.literal('cta'), id: z.string(), data: CtaData }),
  z.object({ kind: z.literal('form'), id: z.string(), data: FormData }),
  z.object({ kind: z.literal('media'), id: z.string(), data: MediaData }),
  z.object({ kind: z.literal('rawhtml'), id: z.string(), data: RawHtmlData }),
  z.object({ kind: z.literal('divider'), id: z.string(), data: DividerData }),
  CategoriesSectionSchema,
  PostsSectionSchema,
]);

export const SectionsArraySchema = z.array(SectionSchema).max(50);

export const SECTION_KINDS: Section['kind'][] = [
  'richtext', 'hero', 'cta', 'form', 'media', 'rawhtml', 'divider', 'categories', 'posts',
];
