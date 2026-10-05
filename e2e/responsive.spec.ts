import { test, expect } from './fixtures';

test.describe('responsive app shell', () => {
  test('at 360px, the sidebar is a drawer toggled by the hamburger button, and there is no horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/dashboard');

    const drawer = page.locator('hlm-sheet-content');
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeHidden();

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('at 1440px, the sidebar is a static column (always visible, no toggle needed)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buildings' })).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('no horizontal overflow at 768px across the primary sections', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });

    for (const path of ['/dashboard', '/devices', '/operations/maintenance', '/access/users']) {
      await page.goto(path);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow, `unexpected horizontal overflow at 768px on ${path}`).toBe(false);
    }
  });
});
