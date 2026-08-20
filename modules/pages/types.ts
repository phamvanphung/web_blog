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

export type Section =
  | RichTextSection
  | HeroSection
  | CtaSection
  | FormSection
  | MediaSection
  | RawHtmlSection
  | DividerSection;

export type SectionKind = Section['kind'];

// ---------------------------------------------------------------------------
// Page with sections
// ---------------------------------------------------------------------------
import type { Page } from '@prisma/client';

export type PageWithSections = Omit<Page, 'sections'> & {
  sections: Section[];
};
