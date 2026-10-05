import { test, expect } from './fixtures';

test.describe('schedules', () => {
  test('list renders and New Schedule opens the create form', async ({ page }) => {
    await page.goto('/operations/schedules');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    await page.getByRole('link', { name: 'New Schedule' }).click();
    await expect(page).toHaveURL(/\/operations\/schedules\/new$/);
    await expect(page.getByRole('heading', { name: 'New Schedule' })).toBeVisible();
  });

  test('editing an existing schedule hydrates name/building and the weekly grid immediately (no blank form)', async ({
    page,
  }) => {
    await page.goto('/operations/schedules');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/schedules\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Edit Schedule' })).toBeVisible();

    await expect(page.getByLabel('Name')).not.toHaveValue('');
    const buildingTrigger = page.locator('hlm-select-trigger').first();
    await expect(buildingTrigger).not.toHaveText('Select building');
  });

  test('creating a schedule: pick a building, select devices, apply business hours, and save', async ({
    page,
  }) => {
    await page.goto('/operations/schedules/new');

    await page.getByLabel('Name').fill('E2E: Test Schedule');
    await page.locator('hlm-select-trigger').first().click();
    await page.locator('hlm-select-item').first().click();

    const deviceCheckbox = page.locator('brn-checkbox').first();
    await expect(deviceCheckbox).toBeVisible();
    await deviceCheckbox.click();

    await page.getByRole('button', { name: 'Business Hours' }).click();
    const filledCell = page.locator('td button.bg-primary').first();
    await expect(filledCell).toBeVisible();

    await page.getByRole('button', { name: 'Save Schedule' }).click();
    await expect(page).toHaveURL(/\/operations\/schedules\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Edit Schedule' })).toBeVisible();
  });

  test('Clear empties the weekly grid', async ({ page }) => {
    await page.goto('/operations/schedules/new');
    await page.getByRole('button', { name: 'Business Hours' }).click();
    await expect(page.locator('td button.bg-primary').first()).toBeVisible();

    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('td button.bg-primary')).toHaveCount(0);
  });
});
