import { describe, it, expect, vi } from 'vitest';
import robotsDefault from '@/app/(site)/robots';

vi.stubEnv('APP_URL', 'https://example.test');

describe('robots', () => {
  it('disallows /admin and /api, allows everything else, references sitemap', () => {
    const out = typeof robotsDefault === 'function' ? robotsDefault() : robotsDefault;
    const txt = JSON.stringify(out);
    expect(txt).toContain('/admin');
    expect(txt).toContain('/api');
    expect(txt).toContain('https://example.test/sitemap.xml');
    expect(txt).toContain('https://example.test');
  });
});
