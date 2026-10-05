import { test, expect } from './fixtures';

test.describe('access assignments (temporary access)', () => {
  test('list renders every derived status and New Assignment opens the create form', async ({
    page,
  }) => {
    await page.goto('/operations/access-assignments');
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Expired').first()).toBeVisible();
    await expect(page.getByText('Revoked').first()).toBeVisible();
    await expect(page.getByText('Scheduled').first()).toBeVisible();

    await page.getByRole('link', { name: 'New Assignment' }).click();
    await expect(page).toHaveURL(/\/operations\/access-assignments\/new$/);
    await expect(page.getByRole('heading', { name: 'New Temporary Assignment' })).toBeVisible();
  });

  test('opening an assignment shows its validity window, scope, and related maintenance/vendor links', async ({
    page,
  }) => {
    await page.goto('/operations/access-assignments');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/access-assignments\/[^/]+$/);
    await expect(
      page.getByRole('heading', { name: 'Validity Window' }).or(page.getByText('VALIDITY WINDOW')),
    ).toBeVisible();
    await expect(page.getByText('Related').or(page.getByText('RELATED'))).toBeVisible();
  });

  test('revoking an active assignment updates its status', async ({ page }) => {
    await page.goto('/operations/access-assignments');
    await page.goto('/operations/access-assignments/aa1');
    await expect(page.getByRole('heading', { name: 'Ray Solano' })).toBeVisible();

    await page.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByRole('button', { name: 'Revoke' })).toHaveCount(0);
  });

  test('the maintenance vendor panel shows an "Access: active" link for an already-granted job', async ({
    page,
  }) => {
    await page.goto('/operations/maintenance/m1');
    await expect(page.getByText('Access: active')).toBeVisible();
    await page.getByText('Access: active').click();
    await expect(page).toHaveURL('/operations/access-assignments/aa1');
  });

  test('granting temporary access from the vendor panel prefills principal, purpose, and scope', async ({
    page,
  }) => {
    await page.goto('/operations/maintenance/m2');
    const panel = page.locator('app-maintenance-vendor-panel');

    await panel.getByRole('button', { name: 'Enter Quotation' }).click();
    await page.getByPlaceholder('Arrival window').fill('Mon 9am');
    await page.getByPlaceholder('Duration (hours)').fill('2');
    await page.getByPlaceholder('Labor cost').fill('200');
    await page.getByPlaceholder('Material cost').fill('50');
    await page.getByRole('button', { name: 'Save Quotation' }).click();
    await panel.getByRole('button', { name: 'Select This Vendor' }).click();
    await page.getByPlaceholder('Technician name').fill('Nina Cho');
    await page.getByRole('button', { name: 'Confirm' }).click();

    await panel.getByRole('link', { name: 'Grant Temporary Access' }).click();
    await expect(page).toHaveURL(/\/operations\/access-assignments\/new\?.*vendorId=v2/);
    await expect(page.getByLabel('Principal name')).toHaveValue('Nina Cho');

    await page.getByRole('button', { name: 'Create Assignment' }).click();
    await expect(page).toHaveURL(/\/operations\/access-assignments\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Nina Cho' })).toBeVisible();
  });
});
