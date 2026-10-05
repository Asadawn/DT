import { test, expect } from './fixtures';

test.describe('access — users', () => {
  test('list renders and New User opens the create form', async ({ page }) => {
    await page.goto('/access/users');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    await page.getByRole('link', { name: 'New User' }).click();
    await expect(page).toHaveURL(/\/access\/users\/new$/);
  });

  test('editing an existing user hydrates every field immediately, with a real role name in the select', async ({
    page,
  }) => {
    await page.goto('/access/users');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/access\/users\/[^/]+$/);

    await expect(page.getByLabel('Name')).not.toHaveValue('');
    await expect(page.getByLabel('Email')).not.toHaveValue('');

    const roleTrigger = page.locator('hlm-select-trigger').first();
    const roleText = (await roleTrigger.textContent())?.trim() ?? '';
    expect(roleText).not.toBe('Select role');
    expect(roleText).not.toMatch(/^r\d+$/);
  });

  test('selecting rows shows the bulk action bar', async ({ page }) => {
    await page.goto('/access/users');
    const checkboxes = page.locator('brn-checkbox');
    await checkboxes.nth(1).click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();
  });

  test('creating a user end to end navigates back to the users list', async ({ page }) => {
    await page.goto('/access/users/new');

    await page.getByLabel('Name').fill('E2E Test User');
    await page.getByLabel('Email').fill('e2e-user@digitaltwin.example');

    await page.locator('hlm-select-trigger').first().click();
    await page.locator('hlm-select-item').first().click();

    await page.getByRole('button', { name: 'Save User' }).click();
    await expect(page).toHaveURL(/\/access\/users$/);
    await expect(page.getByText('E2E Test User')).toBeVisible();
  });
});

test.describe('access — roles', () => {
  test('list renders and New Role opens the create form', async ({ page }) => {
    await page.goto('/access/roles');
    await expect(page.locator('tbody tr').first()).toBeVisible();

    await page.getByRole('link', { name: 'New Role' }).click();
    await expect(page).toHaveURL(/\/access\/roles\/new$/);
  });

  test('editing an existing role hydrates name/description and the permission matrix immediately', async ({
    page,
  }) => {
    await page.goto('/access/roles');
    await page.locator('tbody tr').first().click();
    await expect(page).toHaveURL(/\/access\/roles\/[^/]+$/);

    await expect(page.getByLabel('Name')).not.toHaveValue('');
    const checkedBoxes = page.locator('table brn-checkbox[data-state="checked"]');
    expect(await checkedBoxes.count()).toBeGreaterThan(0);
  });

  test('toggling a permission checkbox in the matrix updates its state', async ({ page }) => {
    await page.goto('/access/roles');
    await page.locator('tbody tr').last().click();
    await expect(page).toHaveURL(/\/access\/roles\/[^/]+$/);

    const firstCheckbox = page.locator('table brn-checkbox').first();
    const before = await firstCheckbox.getAttribute('data-state');
    await firstCheckbox.click();
    await expect(firstCheckbox).not.toHaveAttribute('data-state', before ?? '');
  });
});
