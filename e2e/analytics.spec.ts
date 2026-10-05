import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function passLandingGate(page: Page): Promise<void> {
  await page.locator('hlm-select-trigger').filter({ hasText: 'Select Building' }).click();
  await page.locator('hlm-select-item').first().click();
  await page.locator('hlm-select-trigger').filter({ hasText: 'Select Floor' }).click();
  await page.locator('hlm-select-item').first().click();
  await expect(page.getByText("This is where you'll view your analytics")).toHaveCount(0);
}

test.describe('analytics', () => {
  test('section tabs are reachable from the page itself (the sidebar only links to bare /analytics)', async ({
    page,
  }) => {
    await page.goto('/analytics');
    await passLandingGate(page);
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();

    await page.getByRole('link', { name: 'Electrical' }).click();
    await expect(page).toHaveURL(/\/analytics\/electrical$/);
    await expect(page.getByRole('heading', { name: 'Active Power — all meters' })).toBeVisible();

    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/\/analytics$/);
    await expect(page.getByText("This is where you'll view your analytics")).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Analytics — Overview' })).toBeVisible();
  });

  test('Energy section shows a trend line chart and a bar chart comparing meters', async ({
    page,
  }) => {
    await page.goto('/analytics/energy');
    await expect(page.getByRole('heading', { name: "Today's Energy by Meter" })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(2);
  });

  test('Electrical section shows the full 8-metric Electrical Parameters grid, not the single-device empty state', async ({
    page,
  }) => {
    await page.goto('/analytics/electrical');
    await expect(page.getByRole('heading', { name: 'Active Power — all meters' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(8);
    await expect(page.getByText('No data')).toHaveCount(0);
  });

  test('Environment section shows a trend chart and a current-reading gauge', async ({ page }) => {
    await page.goto('/analytics/environment');
    await expect(page.getByRole('heading', { name: 'Current Reading' })).toBeVisible();
    await expect(page.locator('dt-gauge svg text').first()).toBeVisible();
  });

  test('AQI section shows a trend chart and a current-reading gauge', async ({ page }) => {
    await page.goto('/analytics/aqi');
    await expect(page.getByRole('heading', { name: 'Current Reading' })).toBeVisible();
    await expect(page.locator('dt-gauge svg text').first()).toBeVisible();
  });

  test('Device Health section shows the status summary alongside a connectivity bar chart', async ({
    page,
  }) => {
    await page.goto('/analytics/devices');
    await expect(page.getByRole('heading', { name: 'Device Health', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Devices by Connectivity' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
  });

  test('Overview (bare /analytics) shows the industrial-IoT section layout stacked on one page', async ({
    page,
  }) => {
    await page.goto('/analytics');

    await expect(page.getByText("This is where you'll view your analytics")).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Analytics — Overview' })).toHaveCount(0);
    await passLandingGate(page);
    await expect(page.getByRole('heading', { name: 'Analytics — Overview' })).toBeVisible();

    const sectionHeadings = page.locator('section h2');
    await expect(sectionHeadings).toHaveText([
      'Electrical Parameters',
      'Environmental Parameters',
      'Socket Controls',
      'AQI Sensor Parameters',
      'Device Health',
      'Occupancy',
    ]);
    await expect(page.locator('canvas')).toHaveCount(21);
  });
});
