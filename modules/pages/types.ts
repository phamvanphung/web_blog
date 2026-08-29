import type { JSONContent } from '@tiptap/core';

export type SectionId = string;

export type RichTextSection = {
  kind: 'richtext';
  id: SectionId;
  data: { json: JSONContent };
};

export type HeroSection = {
  kind: 'hero';
  id: SectionId;
  data: {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    mediaId?: string | null;
  };
};

export type CtaSection = {
  kind: 'cta';
  id: SectionId;
  data: {
    title: string;
    body?: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
};

export type FormSection = {
  kind: 'form';
  id: SectionId;
  data: {
    formType: 'contact' | 'newsletter';
    heading?: string;
    body?: string;
  };
};

export type MediaSection = {
  kind: 'media';
  id: SectionId;
  data: {
    mediaId: string;
    layout: 'full' | 'pair';
    caption?: string;
  };
};

export type RawHtmlSection = {
  kind: 'rawhtml';
  id: SectionId;
  data: {
    html: string;
  };
};

export type DividerSection = {
  kind: 'divider';
  id: SectionId;
  data: Record<string, never>;
};

export type CategoryLayout = 'grid-2' | 'grid-3' | 'grid-4';
export type CategoryOrder = 'sortOrder' | 'name';

export type CategoriesSection = {
  kind: 'categories';
  id: SectionId;
  data: {
    groupSlug: string;
    heading?: string;
    body?: string;
    layout: CategoryLayout;
    limit: number;
    showAll: boolean;
    orderBy: CategoryOrder;
  };
};

// ---------------------------------------------------------------------------
// Recent Posts block
// ---------------------------------------------------------------------------
//
// Renders the N most-recently-published posts. The display shape is one of:
//   - 'list'   : vertical stack of (image-bearing) row cards. `limit` items.
//   - 'grid'   : CSS-grid of (image-bearing) tile cards. `cols × rows`
//                determines the total item count, so the user enters both.
//
// `groupSlug` filters posts by CategoryGroup (empty = no filter). The slug
// is resolved to a groupId inside `listRecentPosts` so the editor can stay
// slug-typed (matching CategoryEditor / PageFormClient's existing prop).

export type PostsLayout = 'list' | 'grid';
export type PostsGridCols = 2 | 3 | 4;

export type PostsSection = {
  kind: 'posts';
  id: SectionId;
  data: {
    groupSlug?: string;     // empty/undefined = no filter
    heading?: string;       // section heading (no body, per design)
    layout: PostsLayout;    // 'list' or 'grid'
    limit: number;          // list mode: total items
    cols?: PostsGridCols;   // grid mode: columns (rows = ceil(limit / cols))
    showImage: boolean;
    showTitle: boolean;
    showExcerpt: boolean;
  };
};

export type Section =
  | RichTextSection
  | HeroSection
  | CtaSection
  | FormSection
  | MediaSection
  | RawHtmlSection
  | DividerSection
  | CategoriesSection
  | PostsSection;

export type SectionKind = Section['kind'];

// ---------------------------------------------------------------------------
// Page with sections
// ---------------------------------------------------------------------------
import type { Page } from '@prisma/client';

export type PageWithSections = Omit<Page, 'sections'> & {
  sections: Section[];
};
