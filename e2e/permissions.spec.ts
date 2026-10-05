import { test, expect } from '@playwright/test';

const DEMO_EMAIL_BY_ROLE: Record<string, string> = {
  'Organization Administrator': 'admin@example.com',
  'Building Manager': 'manager@example.com',
  'Internal Technician': 'technician@example.com',
  Viewer: 'viewer@example.com',
};

async function signInAs(page: import('@playwright/test').Page, roleName: string): Promise<void> {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill(DEMO_EMAIL_BY_ROLE[roleName]);
  await page.getByLabel('Password', { exact: true }).fill('e2e-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/sign-in'));
}

test.describe('permissions', () => {
  test('regression guard: a direct navigation (not an in-app link click) to a guarded route still works for a fully-permissioned user', async ({
    page,
  }) => {
    await signInAs(page, 'Organization Administrator');
    await page.goto('/access/roles');
    await expect(page).toHaveURL(/\/access\/roles$/);
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();
  });

  test('a role with no Roles/Users/Vendors grants sees no nav links for them, and direct navigation is blocked', async ({
    page,
  }) => {
    await signInAs(page, 'Internal Technician');

    await expect(page.getByRole('link', { name: 'Roles' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Vendors' })).toHaveCount(0);

    await page.goto('/access/roles');
    await expect(page).toHaveURL(/\/no-permissions$/);
    await expect(page.getByRole('heading', { name: 'No permission' })).toBeVisible();
  });

  test('a view-only role (Viewer) can see Automations but not create one', async ({ page }) => {
    await signInAs(page, 'Viewer');

    await page.goto('/operations/automations');
    await expect(page).toHaveURL(/\/operations\/automations$/);
    await expect(page.getByRole('link', { name: 'New Automation' })).toHaveCount(0);

    await page.goto('/operations/automations/new');
    await expect(page).toHaveURL(/\/no-permissions$/);
  });
});
