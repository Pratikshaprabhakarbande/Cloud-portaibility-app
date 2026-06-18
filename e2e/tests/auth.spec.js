/**
 * E2E smoke: authentication flow (login page renders, demo login works).
 * Assumes the stack is running and seeded.
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('login page loads and shows the sign-in heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('demo login with admin credentials reaches the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@demo.io');
    await page.getByLabel(/password/i).fill('Admin@12345');
    await page.getByRole('button', { name: /sign in/i }).click();
    // After login, the dashboard heading should appear.
    await expect(page.getByRole('heading', { name: /multi-cloud dashboard/i })).toBeVisible({ timeout: 10000 });
  });
});
