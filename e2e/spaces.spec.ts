import { test, expect } from './fixtures';

test.describe('spaces — create a smart room', () => {
  test('New Space seeds a working smart room (Switches + Sensors + an active Entry Lighting automation) and navigates there', async ({
    page,
  }) => {
    await page.goto('/spaces');
    await page.getByRole('button', { name: '+ New Space' }).click();

    const dialog = page.locator('hlm-dialog-content');
    await dialog.getByPlaceholder('e.g. Primary Bedroom').fill('E2E Smart Room');

    const triggers = dialog.locator('hlm-select-trigger');
    await triggers.nth(0).click();
    await page.locator('hlm-select-item').first().click();
    await triggers.nth(1).click();
    await page.locator('hlm-select-item').first().click();

    await dialog.getByRole('button', { name: 'Create Space' }).click();
    await page.waitForURL(/\/buildings\/[^/]+\/floors\/[^/]+\/spaces\/[^/]+$/);

    await expect(page.getByRole('heading', { name: 'E2E Smart Room', exact: true })).toBeVisible();
    await expect(page.getByText('Current Status')).toBeVisible();
    await expect(page.getByText('Access Control')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Fan' }).getByRole('switch')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lights' }).getByRole('switch')).toBeVisible();
    const acCard = page.getByRole('button', { name: 'AC' });
    await expect(acCard.getByRole('switch')).toBeVisible();
    await expect(acCard.getByText('Temperature', { exact: true })).toBeVisible();
    await expect(acCard.getByText('Set Temperature')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Door Contact', exact: true })).toBeVisible();
    await expect(page.getByText('closed').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AQI Sensor', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Motion Sensor', exact: true })).toBeVisible();
    await expect(page.getByText(/battery \d+%/i)).toBeVisible();

    const autoRow = page.locator('app-room-automations li', { hasText: 'Entry Lighting' });
    await expect(autoRow.getByText('Active')).toBeVisible();
    await expect(autoRow.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
