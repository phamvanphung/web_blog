// tests/unit/setting-meta-not-found.test.ts
// Validates the SETTING_META entry for site.notFoundPath is complete.
// Catches regressions where someone removes the entry after a SettingKey
// union change (Record<SettingKey, SettingMeta> would silently allow
// partial objects, but TypeScript's exhaustiveness check on assignment
// is bypassed in some build modes — this test is a runtime safety net).

import { describe, it, expect } from 'vitest';
import { SETTING_META } from '@/app/admin/(authenticated)/settings/SettingMeta';
import type { SettingKey } from '@/modules/settings/types';

describe("SETTING_META['site.notFoundPath']", () => {
  const key: SettingKey = 'site.notFoundPath';
  const meta = SETTING_META[key];

  it('has a non-empty Vietnamese label', () => {
    expect(meta.label).toBeTruthy();
    expect(meta.label.length).toBeGreaterThan(0);
  });

  it('has a description mentioning 404', () => {
    expect(meta.description).toContain('404');
  });

  it("belongs to the 'site' group", () => {
    expect(meta.group).toBe('site');
  });
});
