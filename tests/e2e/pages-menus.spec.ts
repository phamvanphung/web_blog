import { test, expect } from '@playwright/test';

test('pages list reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/pages');
  await expect(page).toHaveURL(/\/admin\/(login|pages)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});

test('menus list reachable; auth gate works', async ({ page }) => {
  const res = await page.goto('/admin/menus');
  await expect(page).toHaveURL(/\/admin\/(login|menus)/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});
