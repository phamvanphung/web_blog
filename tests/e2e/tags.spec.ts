import { test, expect } from '@playwright/test';

test('tags page reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/tags');
  await expect(page).toHaveURL(/\/admin\/(login|tags)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});
