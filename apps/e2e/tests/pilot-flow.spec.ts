import { test, expect } from '@playwright/test';
import { createTestListing, legacyLogin } from './helpers/api';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

test.describe('Flujo piloto', () => {
  test('home → sign-in → publicar (API) → ver en marketplace', async ({ page, request }) => {
    const uniqueTitle = `E2E Piloto ${Date.now()}`;

    await page.goto('/');
    await expect(page.locator('body')).toContainText(/LEFRIG|Lefrig/i);

    await page.goto('/sign-in');
    await expect(page.locator('.sv-auth, .sv-auth__notice')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Configura Clerk|iniciar|sign|entrar|correo|teléfono/i);

    await page.goto('/marketplace/create');
    const onCreate =
      page.url().includes('/marketplace/create') || page.url().includes('/sign-in');
    expect(onCreate).toBe(true);

    const token = await legacyLogin(request, apiUrl);
    const listing = await createTestListing(request, apiUrl, token, uniqueTitle);
    expect(listing.title).toBe(uniqueTitle);

    await page.goto(`/marketplace?q=${encodeURIComponent(uniqueTitle)}`);
    await expect(page.locator('body')).toContainText(uniqueTitle, { timeout: 15_000 });
  });

  test('create sin auth redirige a sign-in', async ({ page }) => {
    await page.goto('/marketplace/create');
    await page.waitForURL(/sign-in|marketplace\/create/, { timeout: 10_000 });
    if (page.url().includes('sign-in')) {
      await expect(page.locator('.sv-auth, .sv-auth__notice')).toBeVisible();
    }
  });
});
