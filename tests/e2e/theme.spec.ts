import { test, expect } from '@playwright/test';

test.describe('Theme management', () => {
  test('admin can change theme.primary and site repaints', async ({ page, context }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(process.env.SEED_ADMIN_EMAIL ?? 'admin@9ent.vn');
    await page.getByLabel('Mật khẩu').fill(process.env.SEED_ADMIN_PASSWORD ?? 'changeme123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/admin\//);

    // Navigate to /admin/theme
    await page.goto('/admin/theme');

    // Change theme.primary to a known test color
    const NEW_PRIMARY = '#1e40af';
    const hexInput = page.locator('input[name="theme.primary"][type="text"]');
    await hexInput.fill(NEW_PRIMARY);

    // Submit
    await page.getByRole('button', { name: /lưu theme/i }).click();
    await expect(page.getByRole('status')).toContainText(/đã lưu/i);

    // Open site in a new tab and verify the new color is applied
    const sitePage = await context.newPage();
    await sitePage.goto('/');

    // The inline <style> in <head> should contain --color-primary
    const styleContent = await sitePage.evaluate(() => {
      const style = document.querySelector('style[data-theme-inline="server"]');
      return style?.textContent ?? '';
    });
    expect(styleContent).toContain('--color-primary:#1e40af');

    // A computed style on a .bg-primary element should resolve to the new color
    // (use the Header CTA button which has bg-primary)
    const headerBg = await sitePage.evaluate(() => {
      const el = document.querySelector('.bg-primary');
      return el ? getComputedStyle(el).backgroundColor : null;
    });
    expect(headerBg).toBe('rgb(30, 64, 175)');

    // Cleanup: reset theme to default
    await page.goto('/admin/theme');
    await page.getByRole('button', { name: /khôi phục mặc định/i }).click();
    await expect(page.getByRole('status')).toContainText(/đã khôi phục/i);
  });

  test('audit log captures theme.update', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(process.env.SEED_ADMIN_EMAIL ?? 'admin@9ent.vn');
    await page.getByLabel('Mật khẩu').fill(process.env.SEED_ADMIN_PASSWORD ?? 'changeme123!');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/admin\//);

    // Save theme (changes may be no-op if values are already default, but the
    // audit row is still written — that's what we're testing).
    await page.goto('/admin/theme');
    await page.getByRole('button', { name: /lưu theme/i }).click();
    await expect(page.getByRole('status')).toContainText(/đã lưu/i);

    // Check audit log
    await page.goto('/admin/audit-log');
    await expect(page.getByText('theme.update', { exact: false })).toBeVisible();
  });
});
