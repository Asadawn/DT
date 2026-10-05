import { test, expect } from './fixtures';

test.describe('room page (Space page) — device display & Add Device', () => {
  test('the global /spaces/:spaceId entry point redirects into building context, where Add Device is reachable', async ({
    page,
  }) => {
    await page.goto('/spaces/b1-f2-s1');
    await expect(page).toHaveURL('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');
    await expect(page.getByRole('button', { name: 'Add Device' })).toBeVisible();
  });

  test('renders capability-driven device cards: an always-visible chart for a sensor, On/Off control for a switch', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');

    const envCard = page.locator('dt-device-quick-view', { hasText: 'Environment Sensor' });
    await expect(envCard.getByRole('heading', { name: 'Environment Sensor' })).toBeVisible();
    await expect(envCard.getByText('Temperature').first()).toBeVisible();
    await expect(envCard.getByText('Humidity').first()).toBeVisible();
    await expect(envCard.locator('canvas')).toBeVisible();

    const switchCard = page.getByRole('button', { name: /Light Switch/ });
    await expect(switchCard).toBeVisible();
    await expect(switchCard.getByRole('switch')).toBeVisible();
  });

  test('Room Energy Summary shows "Not available" without a metered device, and a real total when one exists', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f1/spaces/b1-f1-s1');
    await expect(page.locator('app-room-energy-summary').getByText('Not available')).toBeVisible();

    await page.goto('/buildings/b1/floors/b1-f3/spaces/b1-f3-s1');
    await expect(page.getByText('From Main Meter')).toBeVisible();
    await expect(page.locator('app-room-energy-summary').getByText('kWh')).toBeVisible();
  });

  test('a Temperature & Humidity sensor shows both metrics at once on one chart, and a link to the full Device Page inline, no click needed', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');

    const envCard = page.locator('dt-device-quick-view', { hasText: 'Environment Sensor' });
    await expect(envCard.getByRole('heading', { name: 'Environment Sensor' })).toBeVisible();
    await expect(envCard.getByText('Temperature')).toBeVisible();
    await expect(envCard.getByText('Humidity')).toBeVisible();
    await expect(envCard.locator('canvas')).toBeVisible();

    await envCard.getByRole('link', { name: 'Open Full Device Page' }).click();
    await expect(page).toHaveURL(/\/devices\/[^/]+$/);
  });

  test('the On/Off control inside a device card toggles without opening the Quick View dialog', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');
    const toggle = page.getByRole('button', { name: /Light Switch/ }).getByRole('switch');
    await toggle.click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Add Device wizard walks through all 5 steps and the new device appears in the room', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');
    await page.getByRole('button', { name: 'Add Device' }).click();

    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await page.getByPlaceholder('e.g. Bedroom Motion Sensor').fill('E2E Test Motion Sensor');
    await page.locator('hlm-select-trigger').click();
    await page.getByRole('option', { name: 'Motion' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 2 of 5')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 3 of 5')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Open Office', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 4 of 5')).toBeVisible();
    await page.getByRole('button', { name: 'Check for Signal' }).click();
    await expect(page.getByText(/Signal received|No signal received/)).toBeVisible({
      timeout: 5000,
    });
    if (await page.getByRole('button', { name: 'Save and verify later' }).isVisible()) {
      await page.getByRole('button', { name: 'Save and verify later' }).click();
    }
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 5 of 5')).toBeVisible();
    await page.getByRole('button', { name: 'Add Device' }).click();

    await expect(page.getByRole('button', { name: 'Add Device' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E2E Test Motion Sensor' })).toBeVisible();
  });

  test('a motion sensor shows a real event timeline with battery, not a fabricated chart', async ({
    page,
  }) => {
    await page.goto('/buildings/b2/floors/b2-f1/spaces/b2-f1-s2');
    await expect(page.getByRole('heading', { name: 'Motion Sensor' })).toBeVisible();
    await expect(page.getByText(/battery \d+%/i)).toBeVisible();
    await expect(page.getByText('Motion detected').first()).toBeVisible();
    await expect(page.getByText('Cleared').first()).toBeVisible();
  });

  test('the Automations section toggle enables/disables the automation live, without leaving the room page', async ({
    page,
  }) => {
    await page.goto('/buildings/b1/floors/b1-f2/spaces/b1-f2-s1');
    const row = page.locator('app-room-automations li', { hasText: 'Evening Office Lights Off' });
    await expect(row.getByText('Active')).toBeVisible();

    const toggle = row.getByRole('switch');
    await toggle.click();
    await expect(row.getByText('Paused')).toBeVisible();
    await expect(page).toHaveURL(/\/buildings\/b1\/floors\/b1-f2\/spaces\/b1-f2-s1$/);

    await page.goto('/operations/automations');
    await expect(page.getByText('Evening Office Lights Off').first()).toBeVisible();
  });
});
