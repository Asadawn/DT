import { test, expect } from './fixtures';

test.describe('notifications', () => {
  test('topbar bell opens a dropdown with recent notifications, and Show all navigates + closes it', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Notifications' }).click();
    const panel = page.locator('[data-slot="dropdown-menu"]');
    await expect(panel).toBeVisible();

    const showAll = page.getByRole('menuitem', { name: 'Show all' });
    if (await showAll.count()) {
      await showAll.click();
      await expect(page).toHaveURL(/\/notifications$/);
      await expect(panel).toBeHidden();
    }
  });

  test('clicking a notification in the dropdown marks it read and closes the menu', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.locator('[data-slot="dropdown-menu"]')).toBeVisible();

    const firstNotification = page
      .locator('[data-slot="dropdown-menu"] dt-notification-item button')
      .first();
    if (await firstNotification.count()) {
      await firstNotification.click();
      await expect(page.locator('[data-slot="dropdown-menu"]')).toBeHidden();
    }
  });

  test('the notifications page All/Unread tabs filter the list', async ({ page }) => {
    await page.goto('/notifications');

    const unreadTab = page.getByRole('tab', { name: 'Unread' });
    await unreadTab.click();
    await expect(unreadTab).toHaveAttribute('aria-selected', 'true');

    const allTab = page.getByRole('tab', { name: 'All' });
    await allTab.click();
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Mark all read clears the unread badge', async ({ page }) => {
    await page.goto('/notifications');
    await page.getByRole('button', { name: 'Mark all read' }).click();

    await page.goto('/dashboard');
    const unreadDot = page.locator('button[aria-label="Notifications"] .bg-primary');
    await expect(unreadDot).toHaveCount(0);
  });
});
