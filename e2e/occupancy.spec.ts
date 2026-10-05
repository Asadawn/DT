import { test, expect } from './fixtures';

test.describe('occupancy (booking-derived)', () => {
  test('Room page shows an Occupancy card driven by the current booking', async ({ page }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s3');
    await expect(page.getByText('Current Status')).toBeVisible();
    await expect(page.getByText('Miguel Torres').first()).toBeVisible();
  });

  test('a room with only a future reserved booking shows Reserved, not Occupied', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');
    await expect(page.getByText('Yuki Tanaka').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check In' })).toBeVisible();
  });

  test('a room with no current or upcoming booking shows Vacant', async ({ page }) => {
    await page.goto('/buildings/b2/floors/b2-f1/spaces/b2-f1-s2');
    await expect(page.getByText('No current or upcoming booking for this room.')).toBeVisible();
  });

  test('checking out from the Room page ends the stay and opens a cleaning ticket', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s2');
    await expect(page.getByText('Priya Shah').first()).toBeVisible();
    await page.getByRole('button', { name: 'Check Out' }).click();
    await expect(page.getByText('No current or upcoming booking for this room.')).toBeVisible();

    await page.getByRole('link', { name: 'Maintenances' }).click();
    await expect(page.getByText(/Post-checkout cleaning/)).toBeVisible();
  });

  test('Floor and Building pages show a real "X of Y spaces occupied" rollup', async ({ page }) => {
    await page.goto('/buildings/b1/floors/b1-f2');
    await expect(page.getByText(/Floor Occupancy/)).toBeVisible();
    await expect(page.getByText(/\d+ of \d+ spaces occupied/)).toBeVisible();

    await page.goto('/buildings/b1');
    await expect(page.getByText(/Building Occupancy/)).toBeVisible();
    await expect(page.getByText(/\d+ of \d+ spaces occupied/)).toBeVisible();
  });

  test('Analytics Occupancy tab shows a status summary and an occupancy-rate chart', async ({
    page,
  }) => {
    await page.goto('/analytics/occupancy');
    await expect(page.getByRole('heading', { name: 'Analytics — Occupancy' })).toBeVisible();
    await expect(page.getByText('Occupancy Right Now')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Occupancy Rate/ })).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('Automation Builder can create an Occupancy-changed trigger', async ({ page }) => {
    await page.goto('/operations/automations/new');
    await page.getByLabel('Name').fill('Reception Occupied Alert');

    await page.locator('label:has-text("Building") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'West Campus' }).click();
    await page.locator('label:has-text("Floor (optional)") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Ground Floor' }).first().click();
    await page.locator('label:has-text("Space (optional)") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Reception' }).click();

    await page.locator('label:has-text("Trigger type") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Occupancy changed' }).click();
    await expect(page.getByText('Becomes')).toBeVisible();

    await page.getByRole('button', { name: 'Save Automation' }).click();
    await expect(page).toHaveURL(/\/operations\/automations\/[^/]+$/);
    await expect(page.getByText('When the room becomes occupied')).toBeVisible();
  });

  test('sidebar has an Occupancy link, and the list page shows every space with filters and quick actions', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Occupancy' }).click();
    await expect(page).toHaveURL('/operations/occupancy');
    await expect(page.getByRole('heading', { name: 'Occupancy', exact: true })).toBeVisible();
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    await expect(
      page.getByRole('row', { name: /Manager Room/ }).getByText('Miguel Torres'),
    ).toBeVisible();

    await page.locator('hlm-select-trigger').filter({ hasText: 'All statuses' }).click();
    await page.getByRole('option', { name: 'Vacant' }).click();
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    const statusCells = await page
      .locator('table tbody tr')
      .getByText('Vacant', { exact: true })
      .count();
    expect(statusCells).toBeGreaterThan(0);
  });

  test("the list page's quick actions actually change a space's status", async ({ page }) => {
    await page.goto('/operations/occupancy');
    await page.locator('hlm-select-trigger').filter({ hasText: 'All buildings' }).click();
    await page.getByRole('option', { name: 'Harborview Tower' }).click();

    const row = page.getByRole('row', { name: /^Open Office / });
    await row.getByRole('button', { name: 'Check In' }).click();
    await expect(row.getByText('Occupied', { exact: true })).toBeVisible();
  });
});
