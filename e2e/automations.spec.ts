import { test, expect } from './fixtures';

test.describe('automations', () => {
  test('list renders and New Automation opens the builder', async ({ page }) => {
    await page.goto('/operations/automations');
    await expect(page.locator('table tbody tr').first()).toBeVisible();

    await page.getByRole('link', { name: 'New Automation' }).click();
    await expect(page).toHaveURL(/\/operations\/automations\/new$/);
    await expect(page.getByRole('heading', { name: 'New Automation' })).toBeVisible();
  });

  test('opening an automation shows the When/Then/For summary and execution history', async ({
    page,
  }) => {
    await page.goto('/operations/automations');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/automations\/[^/]+$/);

    await expect(page.getByRole('heading', { name: 'When', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Then', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'For', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Execution History' })).toBeVisible();
  });

  test('Run Now adds a new "Manual run" entry to the execution history', async ({ page }) => {
    await page.goto('/operations/automations');
    await page.locator('table tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/automations\/[^/]+$/);

    const before = await page.getByText('Manual run').count();
    await page.getByRole('button', { name: 'Run Now' }).click();
    await expect(page.getByText('Manual run')).toHaveCount(before + 1);
  });

  test('toggling Enable/Disable from the list updates the status chip without navigating away', async ({
    page,
  }) => {
    await page.goto('/operations/automations');
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    const toggleButton = firstRow.getByRole('button', { name: /Enable|Disable/ });
    const initialLabel = await toggleButton.innerText();

    await toggleButton.click();
    await expect(firstRow.getByRole('button', { name: /Enable|Disable/ })).not.toHaveText(
      initialLabel,
    );
    await expect(page).toHaveURL(/\/operations\/automations$/);
  });

  test('creating an automation end to end: name, building, trigger, and one action', async ({
    page,
  }) => {
    await page.goto('/operations/automations/new');

    await page.getByLabel('Name').fill('E2E: Test Automation');
    await page.locator('hlm-select-trigger').first().click();
    await page.locator('hlm-select-item').first().click();

    await page.getByRole('button', { name: 'Add Action' }).click();
    await page.getByPlaceholder('Notification message').fill('E2E test notification');

    await page.getByRole('button', { name: 'Save Automation' }).click();
    await expect(page).toHaveURL(/\/operations\/automations\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'E2E: Test Automation' })).toBeVisible();
    await expect(page.getByText('Notify: E2E test notification')).toBeVisible();
  });
});
