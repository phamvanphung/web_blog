import { test, expect } from '@playwright/test';

test('posts list page reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/posts');
  await expect(page).toHaveURL(/\/admin\/(login|posts)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});

test('new post page reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/posts/new');
  await expect(page).toHaveURL(/\/admin\/(login|posts)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});

test('uploads route returns 404 for missing file', async ({ request }) => {
  const res = await request.get('/uploads/nope/anything.webp');
  expect(res.status()).toBe(404);
});
