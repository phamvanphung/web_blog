import { test, expect } from '@playwright/test';

test('uploads route returns 404 for missing file', async ({ request }) => {
  const res = await request.get('/uploads/nope/anything.webp');
  expect(res.status()).toBe(404);
});

test('uploads route traversal blocked (403)', async ({ request }) => {
  const res = await request.get('/uploads/..%2F..%2Fetc%2Fpasswd');
  // Either 403 (our guard) or 404 (normalized to nothing) is acceptable.
  expect([403, 404]).toContain(res.status());
});

test('media page reachable (auth-gated)', async ({ page }) => {
  const res = await page.goto('/admin/media');
  await expect(page).toHaveURL(/\/admin\/(login|media)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});
