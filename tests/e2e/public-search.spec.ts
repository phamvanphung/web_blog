import { test, expect } from '@playwright/test';

test('search form submits and shows results', async ({ page }) => {
  await page.goto('/tim-kiem');
  await page.fill('input[name="q"]', 'a');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tim-kiem\?q=a/);
});
