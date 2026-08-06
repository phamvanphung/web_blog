import { test, expect } from '@playwright/test';

test('contact form rejects invalid email', async ({ page }) => {
  await page.goto('/lien-he');
  await page.fill('input[name="name"]', 'Test');
  await page.fill('input[name="email"]', 'not-an-email');
  await page.fill('textarea[name="message"]', 'Hello');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=kiểm tra')).toBeVisible();
});
