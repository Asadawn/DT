import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill('e2e@digitaltwin.example');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/sign-in'));
    await use(page);
  },
});

export { expect };
