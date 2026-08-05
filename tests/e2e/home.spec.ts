import { test, expect } from '@playwright/test';

test('home renders title and footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Blog công ty 9ent/i })).toBeVisible();
  await expect(page.getByText(/Mọi quyền được bảo lưu/i)).toBeVisible();
});

test('admin login page renders', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByRole('heading', { name: /Đăng nhập/i })).toBeVisible();
});

test('health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.db).toBe('up');
});
