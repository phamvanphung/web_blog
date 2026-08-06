import { describe, it, expect } from 'vitest';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  websiteJsonLd,
  organizationJsonLd
} from '@/modules/seo/lib/jsonld';

describe('jsonld builders', () => {
  it('articleJsonLd has @context + @type=Article', () => {
    const x = articleJsonLd({
      title: 'T',
      description: 'D',
      url: 'https://e/x',
      datePublished: '2025-01-01',
      authorName: 'A',
      imageUrl: null
    });
    expect(x['@context']).toBe('https://schema.org');
    expect(x['@type']).toBe('Article');
  });
  it('breadcrumbJsonLd builds items', () => {
    const x = breadcrumbJsonLd([
      { name: 'Home', url: 'https://e/' },
      { name: 'Blog', url: 'https://e/blog' }
    ]);
    expect(x['@type']).toBe('BreadcrumbList');
    expect((x as { itemListElement: unknown[] }).itemListElement.length).toBe(2);
  });
  it('websiteJsonLd includes SearchAction', () => {
    const x = websiteJsonLd({ name: '9ent', url: 'https://e/' });
    expect(x['@type']).toBe('WebSite');
    expect((x as { potentialAction: { target: string } }).potentialAction.target).toContain('tim-kiem');
  });
  it('organizationJsonLd has logo', () => {
    const x = organizationJsonLd({
      name: '9ent',
      url: 'https://e/',
      logo: 'https://e/logo.svg'
    });
    expect(x['@type']).toBe('Organization');
  });
});
