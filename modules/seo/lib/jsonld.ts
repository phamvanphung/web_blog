// modules/seo/lib/jsonld.ts
// JSON-LD builders — return plain objects safe to JSON.stringify in a <script> tag.

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export function articleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  authorName: string;
  imageUrl: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    datePublished: input.datePublished,
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: '9ent',
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.svg` }
    },
    image: input.imageUrl ? [input.imageUrl] : undefined
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  };
}

export function websiteJsonLd(input: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${input.url}/tim-kiem?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function organizationJsonLd(input: { name: string; url: string; logo: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    logo: input.logo
  };
}
