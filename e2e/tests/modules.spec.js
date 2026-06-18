/**
 * E2E smoke: navigate to key module pages after login.
 */
import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@demo.io');
  await page.getByLabel(/password/i).fill('Admin@12345');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
}

test.describe('Module navigation', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('Terraform Center loads', async ({ page }) => {
    await page.goto('/terraform');
    await expect(page.getByRole('heading', { name: /terraform center/i })).toBeVisible();
  });

  test('Security Center loads', async ({ page }) => {
    await page.goto('/security');
    await expect(page.getByRole('heading', { name: /security center/i })).toBeVisible();
  });

  test('AI Cloud Advisor loads', async ({ page }) => {
    await page.goto('/ai-architect');
    await expect(page.getByRole('heading', { name: /ai cloud advisor/i })).toBeVisible();
  });
});
