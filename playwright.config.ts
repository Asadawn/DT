import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E suite (blueprint §49 Phase 9 "Hardening"). Runs against a real `ng
 * serve` dev server — this is a fixture-data app (see CLAUDE.md "Fixture
 * data layer"), so every spec drives the actual UI end to end rather than
 * mocking network calls; there's no backend to intercept.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  // The dev-mode bundle for the Building page (~1MB — 3D model viewer,
  // weather widget, telemetry charts) can be slow to hydrate under local
  // parallel-worker contention; a slightly longer default assertion timeout
  // avoids flaking on that page without masking a real failure elsewhere.
  expect: { timeout: 8_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx ng serve --port 4200',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
