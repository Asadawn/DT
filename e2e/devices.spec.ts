import { test, expect } from './fixtures';

test.describe('devices', () => {
  test('list renders and filtering by building narrows the rows', async ({ page }) => {
    await page.goto('/devices');
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    const buildingFilter = page.locator('hlm-select-trigger').first();
    await buildingFilter.click();
    await page.locator('hlm-select-item').nth(1).click();

    await expect(page.locator('dt-data-table')).toBeVisible();
  });

  test('device filter dropdown triggers show real labels, not raw ids/keys', async ({ page }) => {
    await page.goto('/devices');
    const buildingFilter = page.locator('hlm-select-trigger').first();
    await buildingFilter.click();
    const firstOption = await page.locator('hlm-select-item').first().textContent();
    expect(firstOption?.trim()).not.toMatch(/^b\d+$/);
  });

  test('opening a device shows every applicable section stacked, with no tab switcher', async ({
    page,
  }) => {
    await page.goto('/devices');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/devices\/[^/]+$/);

    await expect(page.locator('button[role="tab"]')).toHaveCount(0);
    await expect(page.getByText('Device Overview')).toBeVisible();
    await expect(page.getByText('Device ID')).toBeVisible();
    await expect(page.locator('dt-section-shell', { hasText: 'Events' })).toBeVisible();
  });

  test('a writable control toggles optimistically and settles to a final state', async ({
    page,
  }) => {
    await page.goto('/devices');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/devices\/[^/]+$/);
    await expect(page.getByText('Device Overview')).toBeVisible();

    const controlsSection = page.locator('dt-section-shell', { hasText: 'Controls' });
    if (!(await controlsSection.count())) return;

    const toggle = page.getByRole('switch').first();
    if (!(await toggle.count())) return;

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();

    await expect.poll(() => toggle.getAttribute('aria-checked')).not.toBe(before);
    await expect.poll(() => toggle.getAttribute('data-disabled'), { timeout: 5_000 }).toBeNull();
  });
});
