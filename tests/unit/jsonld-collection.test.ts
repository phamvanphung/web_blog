import { describe, it, expect } from 'vitest';
import { collectionPageJsonLd } from '@/modules/seo/lib/jsonld';

describe('collectionPageJsonLd', () => {
  it('has @context + @type=CollectionPage', () => {
    const x = collectionPageJsonLd({
      name: 'Dự án',
      description: 'Bài viết Dự án',
      url: 'https://e/chu-de/du-an'
    });
    expect(x['@context']).toBe('https://schema.org');
    expect(x['@type']).toBe('CollectionPage');
  });
  it('omits description when null', () => {
    const x = collectionPageJsonLd({
      name: 'Tag',
      description: null,
      url: 'https://e/tag/foo'
    });
    expect('description' in x ? (x as { description: unknown }).description : undefined).toBeUndefined();
  });
});
