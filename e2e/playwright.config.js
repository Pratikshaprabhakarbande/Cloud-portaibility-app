/**
 * Playwright E2E configuration.
 * Runs against a running stack (docker compose up or local dev servers).
 *
 * Install: npx playwright install --with-deps chromium
 * Run:     npx playwright test
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
