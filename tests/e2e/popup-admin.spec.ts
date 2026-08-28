import { test, expect } from '@playwright/test';

// Admin login: admin@9ent.vn / changeme123! (seed defaults)

test.describe('Admin /admin/popups CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('admin@9ent.vn');
    await page.getByLabel(/password|mật khẩu/i).fill('changeme123!');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();
    await page.waitForURL(/\/admin\/(?!login)/, { timeout: 15000 });
  });

  test('lists existing popups', async ({ page }) => {
    await page.goto('/admin/popups');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Popups' })).toBeVisible({ timeout: 10000 });
    // Either table with popups or empty state message
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText('Chưa có popup').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('creates a new popup and shows it in the list', async ({ page }) => {
    await page.goto('/admin/popups/new');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="name"]');
    // Label/input are siblings in PopupForm, so use name selector for text fields
    await page.locator('input[name="name"]').fill('E2E test popup');
    await page.locator('textarea[name="htmlContent"]').fill('<p>hello e2e</p>');
    // Radio labels wrap inputs, so getByLabel works for them
    await page.getByLabel('Tất cả các trang').check();
    await page.getByLabel('Chỉ 1 lần / browser').check();
    await page.locator('select[name="status"]').selectOption('PUBLISHED');
    await page.getByRole('button', { name: 'Tạo popup' }).click();
    await page.waitForURL(/\/admin\/popups$/);
    await expect(page.getByText('E2E test popup')).toBeVisible();
  });

  test('edits an existing popup', async ({ page }) => {
    await page.goto('/admin/popups');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'Sửa' }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[name="name"]');
    await page.locator('input[name="name"]').fill('E2E test edited');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await page.waitForURL(/\/admin\/popups$/);
    await expect(page.getByText('E2E test edited').first()).toBeVisible();
  });

  test('soft-deletes a popup', async ({ page }) => {
    await page.goto('/admin/popups');
    await page.waitForLoadState('networkidle');
    const before = await page.locator('tbody tr').count();
    // Only delete if there's something to delete
    if (before > 0) {
      await page.getByRole('button', { name: 'Xóa' }).first().click();
      // Wait for the row count to decrease (server action updates the page)
      await page.waitForFunction(
        ({ beforeCount }) => document.querySelectorAll('tbody tr').length < beforeCount,
        { beforeCount: before },
        { timeout: 10000 }
      );
      const after = await page.locator('tbody tr').count();
      expect(after).toBeLessThan(before);
    }
  });
});
