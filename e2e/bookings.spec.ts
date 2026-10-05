import { test, expect } from './fixtures';

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test.describe('bookings (managed from the Occupancy page)', () => {
  test('the Occupancy page\'s "New Booking" link opens the booking form', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Occupancy' }).click();
    await expect(page).toHaveURL('/operations/occupancy');
    await page.getByRole('link', { name: 'New Booking' }).click();
    await expect(page).toHaveURL('/operations/occupancy/bookings/new');
    await expect(page.getByRole('heading', { name: 'New Booking' })).toBeVisible();
  });

  test('creating a booking, checking it in, and checking it out — full lifecycle from the detail page', async ({
    page,
  }) => {
    await page.goto('/operations/occupancy/bookings/new');
    await page.getByLabel('Guest name').fill('E2E Test Guest');

    await page.locator('label:has-text("Building") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Harborview Tower' }).click();
    await page.locator('label:has-text("Floor") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Floor 3' }).click();
    await page.locator('label:has-text("Space") hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Open Office 3A' }).click();

    await page.getByLabel('Check-in date').fill(isoDaysFromNow(0));
    await page.getByLabel('Check-in date').blur();
    await page.getByLabel('Check-out date').fill(isoDaysFromNow(1));
    await page.getByLabel('Check-out date').blur();

    await page.getByRole('button', { name: 'Create Booking' }).click();
    await expect(page).toHaveURL(/\/operations\/occupancy\/bookings\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'E2E Test Guest' })).toBeVisible();

    await page.getByRole('button', { name: 'Check In' }).click();
    await expect(page.getByText('Checked In', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check Out' })).toBeVisible();

    await page.getByRole('button', { name: 'Check Out' }).click();
    await expect(page.getByText('Checked Out', { exact: true })).toBeVisible();
    await expect(page.getByText('No further actions')).toBeVisible();

    await expect(page.getByText(/Post-checkout cleaning/)).toBeVisible();
  });

  test('creating an overlapping booking on an already-booked space is rejected with an inline error', async ({
    page,
  }) => {
    await page.goto(
      '/operations/occupancy/bookings/new?buildingId=b1&floorId=b1-f2&spaceId=b1-f2-s3',
    );
    await page.getByLabel('Guest name').fill('Overlap Test');
    await page.getByLabel('Check-in date').fill(isoDaysFromNow(0));
    await page.getByLabel('Check-in date').blur();
    await page.getByLabel('Check-out date').fill(isoDaysFromNow(1));
    await page.getByLabel('Check-out date').blur();

    await page.getByRole('button', { name: 'Create Booking' }).click();
    await expect(page.getByText(/already booked/)).toBeVisible();
    await expect(page).toHaveURL(/\/operations\/occupancy\/bookings\/new/);
  });

  test("the Occupancy list's action icons edit a reserved booking", async ({ page }) => {
    await page.goto('/operations/occupancy');
    await page.locator('hlm-select-trigger').filter({ hasText: 'All buildings' }).click();
    await page.getByRole('option', { name: 'Harborview Tower' }).click();
    const row = page.locator('tbody tr', { hasText: 'Open Office' });

    await row.getByRole('link', { name: 'Edit booking' }).click();
    await expect(page).toHaveURL(/\/operations\/occupancy\/bookings\/[^/]+\/edit$/);
    await expect(page.getByRole('heading', { name: 'Edit Booking' })).toBeVisible();
    await expect(page.getByLabel('Guest name')).toHaveValue('Yuki Tanaka');

    await page.getByLabel('Guest name').fill('Yuki Tanaka-Edited');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page).toHaveURL(/\/operations\/occupancy\/bookings\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Yuki Tanaka-Edited' })).toBeVisible();
  });

  test('a reserved booking past its checkout date shows a "Needs a decision" badge and can be marked no-show', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f1/spaces/b1-f1-s2');
    await page.getByText(/Whitfield Group/).click();
    await expect(page.getByText('Needs a decision')).toBeVisible();

    await page.getByRole('button', { name: 'Mark No-Show' }).click();
    await expect(page.getByText('No Show', { exact: true })).toBeVisible();
  });
});
