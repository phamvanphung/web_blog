import type { Metadata } from 'next';

export type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
};

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export function buildMetadata(input: BuildMetaInput): Metadata {
  const url = input.path ? `${APP_URL}${input.path}` : APP_URL;
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
      images: input.ogImage ? [{ url: input.ogImage }] : undefined
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: input.ogImage ? [input.ogImage] : undefined
    }
  };
}
