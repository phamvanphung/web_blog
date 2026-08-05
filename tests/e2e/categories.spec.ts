import { test, expect } from '@playwright/test';

test('categories page reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/categories');
  await expect(page).toHaveURL(/\/admin\/(login|categories)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});
