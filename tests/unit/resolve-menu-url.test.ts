import { describe, it, expect } from 'vitest';
import { resolveMenuItemHref } from '@/modules/menus/server/public';

describe('resolveMenuItemHref', () => {
  it('PAGE → /<slug>', () => {
    expect(
      resolveMenuItemHref({
        type: 'PAGE',
        targetId: null,
        externalUrl: null,
        targetSlug: 'gioi-thieu'
      })
    ).toBe('/gioi-thieu');
  });
  it('POST → /blog/<slug>', () => {
    expect(
      resolveMenuItemHref({
        type: 'POST',
        targetId: null,
        externalUrl: null,
        targetSlug: 'bai-viet-1'
      })
    ).toBe('/blog/bai-viet-1');
  });
  it('CATEGORY → /chu-de/<slug>', () => {
    expect(
      resolveMenuItemHref({
        type: 'CATEGORY',
        targetId: null,
        externalUrl: null,
        targetSlug: 'du-an'
      })
    ).toBe('/chu-de/du-an');
  });
  it('EXTERNAL → externalUrl', () => {
    expect(
      resolveMenuItemHref({
        type: 'EXTERNAL',
        targetId: null,
        externalUrl: 'https://fb.com',
        targetSlug: null
      })
    ).toBe('https://fb.com');
  });
  it('EXTERNAL w/o url → #', () => {
    expect(
      resolveMenuItemHref({
        type: 'EXTERNAL',
        targetId: null,
        externalUrl: null,
        targetSlug: null
      })
    ).toBe('#');
  });
  it('PAGE w/o slug → #', () => {
    expect(
      resolveMenuItemHref({
        type: 'PAGE',
        targetId: null,
        externalUrl: null,
        targetSlug: null
      })
    ).toBe('#');
  });
});
