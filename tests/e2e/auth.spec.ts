import { test, expect } from '@playwright/test';

test('login form renders with email + password fields', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByRole('heading', { name: /Đăng nhập/i })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('admin/dashboard redirects to login when unauthenticated', async ({ page }) => {
  const res = await page.goto('/admin/dashboard');
  // Either a redirect chain lands us at /admin/login, or the page renders the login form directly.
  await expect(page).toHaveURL(/\/admin\/login/);
  expect(res?.status() ?? 200).toBeLessThan(500);
});

test('logout endpoint clears cookie without exception', async ({ request }) => {
  // No session cookie → clear → no exception
  const res = await request.post('/admin/logout');
  expect([200, 303, 307]).toContain(res.status());
});
