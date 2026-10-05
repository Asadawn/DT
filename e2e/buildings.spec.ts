import { test, expect } from './fixtures';

test.describe('buildings', () => {
  test('bare /buildings redirects to the default building — there is no standalone list', async ({
    page,
  }) => {
    await page.goto('/buildings');
    await expect(page).toHaveURL(/\/buildings\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Buildings');
  });
});
