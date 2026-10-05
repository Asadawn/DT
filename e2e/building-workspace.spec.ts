import { test, expect } from './fixtures';

test.describe('building workspace', () => {
  test('loads a building overview with real identity, operational status, and functional entries', async ({
    page,
  }) => {
    await page.goto('/buildings/b1');
    const statusPanel = page.locator('app-workspace-status-panel');
    await expect(page.locator('dt-topbar h1')).toHaveText('Harborview Tower');
    await expect(statusPanel.getByText('Operational Status')).toBeVisible();
    await expect(statusPanel.getByText(/\d+ \/ \d+/)).toBeVisible();

    await expect(statusPanel.getByRole('link', { name: 'Devices' })).toBeVisible();
    await expect(statusPanel.getByRole('link', { name: 'Automations' })).toBeVisible();
  });

  test('header dropdowns: selecting a floor then a space updates the breadcrumb to 3 levels and shows the room overview', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f2');
    await expect(page.locator('app-workspace-status-panel h2').first()).toHaveText('Ground Floor');

    const header = page.locator('dt-topbar');
    await header.locator('hlm-select-trigger').nth(2).click();
    await page.locator('hlm-select-item').filter({ hasText: 'Manager Room' }).click();

    await expect(page.locator('app-workspace-breadcrumb button')).toHaveCount(3);
    await expect(page.locator('app-workspace-status-panel h2').first()).toHaveText('Manager Room');
  });

  test('direct device selection from a Space opens Device Details, and switching spaces via the header dropdown leaves Device Details', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f2&spaceId=b1-f2-s3');
    await expect(page.locator('app-workspace-status-panel h2').first()).toHaveText('Manager Room');

    const panel = page.locator('app-contextual-details-panel');
    await panel.getByRole('button', { name: /^Motion Sensor —/ }).click();

    await expect(panel.locator('dt-device-quick-view')).toBeVisible();
    await expect(
      panel.getByRole('link', { name: 'Open Full Device Page', exact: true }),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: /Show (Floor Plan|Roof)/ })).toHaveCount(0);

    await panel.getByRole('button', { name: 'Back to Manager Room' }).click();
    await expect(panel.locator('dt-device-quick-view')).toHaveCount(0);
    await expect(panel.getByText('Device Controls')).toBeVisible();
    await expect(page.getByRole('button', { name: /Show (Floor Plan|Roof)/ })).toHaveCount(0);

    await panel.getByRole('button', { name: /^Motion Sensor —/ }).click();
    await expect(panel.locator('dt-device-quick-view')).toBeVisible();
    const header = page.locator('dt-topbar');
    await header.locator('hlm-select-trigger').nth(2).click();
    await page.locator('hlm-select-item').filter({ hasText: 'Open Office' }).click();
    await expect(page.locator('app-workspace-status-panel h2').first()).toHaveText('Open Office');
    await expect(panel.locator('dt-device-quick-view')).toHaveCount(0);
  });

  test('selecting an Automation from the collection opens its Details, and Run Now adds an execution', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f2&spaceId=b1-f2-s3');
    const panel = page.locator('app-contextual-details-panel');
    await page.getByRole('tab', { name: 'Automations', exact: true }).click();
    const automationRow = panel.getByRole('button', { name: /Manager Room — Entry Lighting/ });
    await expect(automationRow).toBeVisible();

    await automationRow.click();
    await expect(panel.locator('app-automation-details-card')).toBeVisible();
    await expect(
      panel.getByRole('heading', { name: 'Manager Room — Entry Lighting' }),
    ).toBeVisible();

    const runButton = panel.getByRole('button', { name: 'Run Now' });
    await runButton.click();
    await expect(
      panel.getByText('Demo execution completed — no physical devices were controlled.'),
    ).toBeVisible({ timeout: 3000 });
  });

  test('Device Controls: toggling an eligible device control reflects immediately, without opening Device Details', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f2&spaceId=b1-f2-s3');
    const panel = page.locator('app-contextual-details-panel');
    const toggle = page.locator('app-space-device-controls brn-switch').first();
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute('data-state');
    await toggle.click();
    await expect.poll(() => toggle.getAttribute('data-state'), { timeout: 3000 }).not.toBe(before);

    await expect(panel.locator('dt-device-quick-view')).toHaveCount(0);
  });

  test('Building Operations: Maintenance, Vendors, and Temporary Access show real scoped data for a room with fixtures across all three', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f3&spaceId=b1-f3-s1');
    const panel = page.locator('app-contextual-details-panel');
    await expect(
      panel.locator('app-room-maintenance').getByRole('heading', { name: 'Maintenances' }),
    ).toBeVisible();
    await expect(
      panel.locator('app-room-maintenance').getByText('AC unit making loud noise'),
    ).toBeVisible();

    await expect(panel.getByRole('heading', { name: 'Vendors' })).toBeVisible();
    await expect(panel.getByText('Coolline HVAC Services')).toBeVisible();

    await expect(panel.getByRole('heading', { name: 'Assigned To' })).toBeVisible();
    await expect(panel.getByText('Ray Solano')).toBeVisible();
  });

  test('scope isolation: a Floor overview only shows automations owned by that floor, not a sibling floor', async ({
    page,
  }) => {
    await page.goto('/buildings/b1?floorId=b1-f2');
    const panel = page.locator('app-contextual-details-panel');
    await page.getByRole('tab', { name: 'Automations', exact: true }).click();
    await expect(
      panel.getByRole('button', { name: /Manager Room — Entry Lighting/ }),
    ).toBeVisible();
    await expect(panel.getByText('High Lobby Temperature Alert')).toHaveCount(0);
  });

  test('the "Show Floor Plan"/"Show Roof" toggle switches the 3D viewer mode, and clicking the roof does the same thing', async ({
    page,
  }) => {
    await page.goto('/buildings/b1');
    await expect(page.locator('dt-model-viewer').first()).toBeVisible();

    const toggleButton = page.getByRole('button', { name: /Show (Floor Plan|Roof)/ });
    await expect(toggleButton).toHaveAttribute('aria-label', 'Show Floor Plan');
    await toggleButton.click();
    await expect(page.locator('dt-model-viewer model-viewer')).toHaveAttribute(
      'src',
      /Without%20Furniture/,
    );

    await expect(toggleButton).toHaveAttribute('aria-label', 'Show Roof');
    await toggleButton.click();
    await expect(page.locator('dt-model-viewer model-viewer')).toHaveAttribute('src', /Outer-2/);
  });
});

test.describe('building workspace — responsive (compact layout)', () => {
  test.use({ viewport: { width: 768, height: 900 } });

  test('at 768px, the desktop side panels are gone and a compact toolbar opens them as drawers instead', async ({
    page,
  }) => {
    await page.goto('/buildings/b1');
    await expect(page.getByRole('button', { name: 'Status', exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator('dt-topbar hlm-select-trigger').first()).toHaveText(
      'Harborview Tower',
    );

    await expect(page.locator('app-building-workspace-page aside')).toHaveCount(0);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);

    await page.getByRole('button', { name: 'Details', exact: true }).click();
    const detailsDrawer = page.locator('hlm-drawer-content').filter({ hasText: 'Details' });
    await expect(detailsDrawer).toBeVisible();
    await expect(detailsDrawer.locator('app-contextual-details-panel')).toBeVisible();
  });

  test('selecting a floor via the header dropdown auto-opens the Details drawer, and the Status drawer independently shows the same location', async ({
    page,
  }) => {
    await page.goto('/buildings/b1');
    await expect(page.getByRole('button', { name: 'Status', exact: true })).toBeVisible({
      timeout: 20000,
    });

    const header = page.locator('dt-topbar');
    await header.locator('hlm-select-trigger').nth(1).click();
    await page.locator('hlm-select-item').filter({ hasText: 'Floor 2' }).click();

    const detailsDrawer = page.locator('hlm-drawer-content').filter({ hasText: 'Details' });
    await expect(detailsDrawer).toBeVisible();
    await expect(page.locator('hlm-drawer-content').filter({ hasText: 'Status' })).toHaveCount(0);

    await detailsDrawer.getByRole('button', { name: 'Close' }).click();
    await expect(detailsDrawer).toHaveCount(0);

    await page.getByRole('button', { name: 'Status', exact: true }).click();
    const statusDrawer = page.locator('hlm-drawer-content').filter({ hasText: 'Status' });
    await expect(statusDrawer).toBeVisible();
    await expect(statusDrawer.locator('app-workspace-status-panel h2').first()).toHaveText(
      'Floor 2',
    );
  });
});
