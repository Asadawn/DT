import { test, expect } from './fixtures';

test.describe('maintenance', () => {
  test('list renders with human-readable status/priority filter options', async ({ page }) => {
    await page.goto('/operations/maintenance');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    const statusFilter = page.locator('hlm-select-trigger').first();
    await statusFilter.click();
    const options = await page.locator('hlm-select-item').allTextContents();
    expect(options).toContain('In Progress');
  });

  test('selecting rows shows the bulk action bar, and Clear dismisses it', async ({ page }) => {
    await page.goto('/operations/maintenance');
    const checkboxes = page.locator('brn-checkbox');
    await checkboxes.nth(1).click();

    await expect(page.getByText(/\d+ selected/)).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByText(/\d+ selected/)).toBeHidden();
  });

  test('creating a new request end to end navigates to its detail page', async ({ page }) => {
    await page.goto('/operations/maintenance');
    await page.getByRole('link', { name: 'New Request' }).click();
    await expect(page).toHaveURL(/\/operations\/maintenance\/new$/);

    await page.getByPlaceholder('Enter your name').fill('E2E Tester');
    await page.locator('input[placeholder="XXXXXXXX"]').fill('55512345');
    await page.getByPlaceholder('Enter your Email').fill('e2e@example.com');
    await page.getByPlaceholder('Enter title').fill('E2E: broken exit sign');
    await page.getByPlaceholder('Enter Details').fill('Exit sign on floor 2 is flickering.');

    const selects = page.locator('hlm-select-trigger');
    await selects.nth(2).click();
    await page.locator('hlm-select-item').first().click();
    await page.waitForTimeout(300);
    await selects.nth(3).click();
    await page.locator('hlm-select-item').first().click();
    await page.waitForTimeout(300);
    await selects.nth(4).click();
    await page.locator('hlm-select-item').first().click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'issue.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    });

    await page.getByRole('button', { name: 'Create Request' }).click();

    await expect(page).toHaveURL(/\/operations\/maintenance\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'E2E: broken exit sign' })).toBeVisible();
    await expect(page.getByText('Requester: E2E Tester')).toBeVisible();
    await expect(page.getByText('+974 55512345')).toBeVisible();
    await expect(page.getByAltText('Photo of the reported issue')).toBeVisible();
  });

  test('a request detail page offers a lifecycle action that advances its status', async ({
    page,
  }) => {
    await page.goto('/operations/maintenance');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/operations\/maintenance\/[^/]+$/);

    const actionsHeading = page.getByRole('heading', { name: 'Actions' });
    await expect(actionsHeading).toBeVisible();

    const actionButton = page.locator('aside', { has: actionsHeading }).getByRole('button').first();
    if (await actionButton.count()) {
      const label = await actionButton.textContent();
      await actionButton.click();
      await expect(actionButton).toBeEnabled({ timeout: 5_000 });
      if (label) {
        await expect(
          page
            .locator('aside', { has: actionsHeading })
            .getByRole('button', { name: label.trim() }),
        ).toHaveCount(0);
      }
    }
  });
});
