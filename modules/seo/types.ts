export type SeoMeta = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
};

export type JsonLd =
  | { '@context': 'https://schema.org'; '@type': 'Article'; [k: string]: unknown }
  | { '@context': 'https://schema.org'; '@type': 'Organization'; [k: string]: unknown }
  | { '@context': 'https://schema.org'; '@type': 'BreadcrumbList'; [k: string]: unknown }
  | { '@context': 'https://schema.org'; '@type': 'WebSite'; [k: string]: unknown };
