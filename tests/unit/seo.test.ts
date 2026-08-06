import { describe, it, expect } from 'vitest';
import { buildMetadata, defaultOgImage } from '@/lib/seo';

describe('buildMetadata', () => {
  it('always emits at least one OG image even when ogImage omitted', () => {
    const m = buildMetadata({
      title: 'T',
      description: 'D',
      path: '/'
    });
    const og = m.openGraph as { images?: Array<{ url: string }> } | undefined;
    expect(og?.images?.[0]?.url).toBe(defaultOgImage());
  });

  it('uses explicit ogImage when provided', () => {
    const m = buildMetadata({
      title: 'T',
      description: 'D',
      path: '/blog/a',
      ogImage: 'https://cdn/x.webp'
    });
    const og = m.openGraph as { images?: Array<{ url: string }> } | undefined;
    expect(og?.images?.[0]?.url).toBe('https://cdn/x.webp');
  });

  it('canonical uses APP_URL + path', () => {
    const m = buildMetadata({ title: 'T', description: 'D', path: '/blog/a' });
    const a = m.alternates as { canonical?: string } | undefined;
    expect(a?.canonical).toBe('http://localhost:3000/blog/a');
  });

  it('noindex emits robots.noindex', () => {
    const m = buildMetadata({
      title: 'T',
      description: 'D',
      path: '/admin',
      noindex: true
    });
    const r = m.robots as { index?: boolean; follow?: boolean } | undefined;
    expect(r?.index).toBe(false);
    expect(r?.follow).toBe(false);
  });
});

describe('defaultOgImage', () => {
  it('returns APP_URL + /og-default.svg', () => {
    expect(defaultOgImage('https://x.test')).toBe('https://x.test/og-default.svg');
  });
});
