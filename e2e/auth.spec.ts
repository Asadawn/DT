import { test, expect } from '@playwright/test';

test.describe('auth guard', () => {
  test('redirects an unauthenticated visit to a protected route, with returnUrl', async ({
    page,
  }) => {
    await page.goto('/devices');
    await expect(page).toHaveURL(/\/auth\/sign-in\?returnUrl=%2Fdevices/);
  });

  test('sign-in with a returnUrl sends the user back to the originally requested route', async ({
    page,
  }) => {
    await page.goto('/operations/maintenance');
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    await page.getByLabel('Email').fill('e2e@digitaltwin.example');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/operations\/maintenance$/);
    await expect(page.getByRole('heading', { name: 'Maintenance' })).toBeVisible();
  });

  test('sign-in with no returnUrl lands on the dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill('e2e@digitaltwin.example');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('empty email/password shows validation errors and does not sign in', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await page.getByLabel('Email').click();
    await page.getByLabel('Password', { exact: true }).click();
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('signing out locks the app again', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill('e2e@digitaltwin.example');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: 'Account' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
