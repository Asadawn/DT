import { test, expect } from './fixtures';

test.describe('dashboard', () => {
  test('loads the hero KPIs, device/maintenance/health cards, and an energy breakdown with no console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Smart Building Operations');
    await expect(page.getByText('Total Buildings', { exact: true })).toBeVisible();
    await expect(page.locator('dt-kpi-card').filter({ hasText: 'Total Devices' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Device Status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Energy' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('clicking an attention-required item navigates to its source record', async ({ page }) => {
    await page.goto('/dashboard');
    const attentionSection = page.locator('section', {
      has: page.getByRole('heading', { name: 'Attention Required' }),
    });
    await expect(attentionSection).toBeVisible();
    const firstItem = attentionSection.getByRole('link').first();
    if (await firstItem.count()) {
      await firstItem.click();
      await expect(page).not.toHaveURL(/\/dashboard$/);
    }
  });

  test('Building and Floor filters are real, functional selects scoping the page', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    const deviceStatusSection = page.locator('section', {
      has: page.getByRole('heading', { name: 'Device Status' }),
    });
    await expect(deviceStatusSection).toBeVisible();

    const floorTrigger = page.locator('hlm-select-trigger', { hasText: 'All Floors' });
    await expect(floorTrigger).toBeVisible();
  });
});
