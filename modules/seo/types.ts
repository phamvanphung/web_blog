export type SeoMeta = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
};

export type JsonLd = {
  '@context': string;
  '@type': string;
  [k: string]: unknown;
};
