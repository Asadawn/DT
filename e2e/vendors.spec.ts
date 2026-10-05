import { test, expect } from './fixtures';

test.describe('vendors', () => {
  test('directory list renders and New Vendor opens the create form', async ({ page }) => {
    await page.goto('/operations/vendors');
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    await page.getByRole('link', { name: 'New Vendor' }).click();
    await expect(page).toHaveURL(/\/operations\/vendors\/new$/);
    await expect(page.getByRole('heading', { name: 'New Vendor' })).toBeVisible();
  });

  test('opening a vendor shows its contact info and invitation history', async ({ page }) => {
    await page.goto('/operations/vendors');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/vendors\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Invitations' })).toBeVisible();
  });

  test('creating a vendor end to end navigates to its detail page', async ({ page }) => {
    await page.goto('/operations/vendors/new');

    await page.getByLabel('Vendor name').fill('E2E: Test Vendor Co');
    await page.getByLabel('Contact name').fill('Jordan Blake');
    await page.getByLabel('Contact email').fill('jordan@e2e-vendor.example');
    await page.locator('brn-checkbox').first().click();

    await page.getByRole('button', { name: 'Save Vendor' }).click();
    await expect(page).toHaveURL(/\/operations\/vendors\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'E2E: Test Vendor Co' })).toBeVisible();
  });

  test('maintenance detail embeds a vendor panel showing invitation statuses', async ({ page }) => {
    await page.goto('/operations/maintenance/m1');
    await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
    await expect(page.getByText('Selected').first()).toBeVisible();
  });

  test('full vendor lifecycle on a maintenance request: quote, select, advance job, add evidence', async ({
    page,
  }) => {
    await page.goto('/operations/maintenance/m2');
    const panel = page.locator('app-maintenance-vendor-panel');
    await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();

    await panel.getByRole('button', { name: 'Enter Quotation' }).click();
    await page.getByPlaceholder('Arrival window').fill('Mon 9am');
    await page.getByPlaceholder('Duration (hours)').fill('2');
    await page.getByPlaceholder('Labor cost').fill('200');
    await page.getByPlaceholder('Material cost').fill('50');
    await page.getByRole('button', { name: 'Save Quotation' }).click();
    await expect(panel.getByText('Quoted')).toBeVisible();

    await panel.getByRole('button', { name: 'Select This Vendor' }).click();
    await page.getByPlaceholder('Technician name').fill('E2E Technician');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(panel.getByText('Selected')).toBeVisible();
    await expect(panel.getByText('Assigned')).toBeVisible();

    await page.getByRole('button', { name: /Mark in-progress/i }).click();
    await expect(panel.getByText('In Progress')).toBeVisible();

    await page.getByPlaceholder('Add a note (evidence)').fill('E2E evidence note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(panel.getByText('E2E evidence note')).toBeVisible();
  });

  test('Request Quotations invites a vendor and shows an Invited status', async ({ page }) => {
    await page.goto('/operations/maintenance/m4');
    const panel = page.locator('app-maintenance-vendor-panel');
    await page.getByRole('button', { name: 'Request Quotations' }).click();
    await page.locator('brn-checkbox').first().click();
    await page.getByRole('button', { name: 'Send Invitations' }).click();
    await expect(panel.getByText('Invited')).toBeVisible();
  });
});

test.describe('vendor portal', () => {
  test("is a separate restricted view with no app shell, showing only this vendor's own jobs", async ({
    page,
  }) => {
    await page.goto('/vendor-portal/v1');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Coolline HVAC Services' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Jobs' })).toBeVisible();
    await expect(page.getByText('AC unit making loud noise')).toBeVisible();
  });

  test('advancing job status and adding evidence from the portal works', async ({ page }) => {
    await page.goto('/vendor-portal/v1');
    await expect(page.getByText('In Progress')).toBeVisible();

    await page.getByRole('button', { name: /Mark complete/i }).click();
    await expect(page.getByText('Complete', { exact: true })).toBeVisible();

    await expect(page.getByPlaceholder('Add a note (evidence)')).toHaveCount(0);
  });

  test('Exit portal link and the Vendor Detail\'s "View Technician Portal" link round-trip correctly', async ({
    page,
  }) => {
    await page.goto('/operations/vendors/v1');
    await page.getByRole('link', { name: 'View Technician Portal' }).click();
    await expect(page).toHaveURL('/vendor-portal/v1');

    await page.getByRole('link', { name: 'Exit portal' }).click();
    await expect(page).toHaveURL('/operations/vendors/v1');
  });
});
