import { test, expect } from '@playwright/test';

test('blog list loads', async ({ page }) => {
  const res = await page.goto('/blog');
  expect(res?.status() ?? 200).toBe(200);
  await expect(page.locator('h1').first()).toContainText('Blog');
});

test('blog detail 404 for unknown slug', async ({ page }) => {
  const res = await page.goto('/blog/this-does-not-exist');
  expect(res?.status()).toBe(404);
});

test('category index loads', async ({ page }) => {
  const res = await page.goto('/chu-de');
  expect(res?.status() ?? 200).toBe(200);
});

test('search page loads with form', async ({ page }) => {
  const res = await page.goto('/tim-kiem');
  expect(res?.status() ?? 200).toBe(200);
  await expect(page.locator('input[name="q"]')).toBeVisible();
});

test('contact page loads', async ({ page }) => {
  const res = await page.goto('/lien-he');
  expect(res?.status() ?? 200).toBe(200);
  await expect(page.locator('input[name="name"]')).toBeVisible();
});
