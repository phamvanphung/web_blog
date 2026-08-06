// lib/seo.ts
// Central metadata builder. Every public route uses buildMetadata() so we get
// consistent canonical, OG and Twitter tags. Use `defaultOgImage()` to point
// at the branded /og-default.svg asset.

import type { Metadata } from 'next';

export type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
};

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

export function defaultOgImage(url = appUrl()): string {
  return `${url}/og-default.svg`;
}

export function buildMetadata(input: BuildMetaInput): Metadata {
  const url = input.path ? `${appUrl()}${input.path}` : appUrl();
  const image = input.ogImage ?? defaultOgImage();
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: input.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
}
