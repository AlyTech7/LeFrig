import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

test.describe('LeFrig smoke', () => {
  test('API health responde ok', async ({ request }) => {
    const res = await request.get(`${apiUrl}/health`);
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    expect(body.db).toBe('connected');
  });

  test('Home web carga con marca Lefrig', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/LEFRIG|Lefrig/i);
  });

  test('Marketplace público accesible', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page.locator('body')).toContainText(/mercado|Marketplace|anuncio/i);
  });

  test('Comunidad página accesible', async ({ page }) => {
    await page.goto('/community');
    await expect(page.locator('body')).toContainText(/Comunidad|community|forum/i);
  });

  test('Transporte página carga', async ({ page }) => {
    await page.goto('/transport');
    await expect(page.locator('body')).toContainText(/Transporte|Tindouf/i);
  });

  test('Mapa comunitario /locations carga', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('body')).toContainText(/Mapa|marsa|campamento/i);
  });
});
