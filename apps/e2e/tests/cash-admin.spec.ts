import { test, expect } from '@playwright/test';
import { legacyLogin } from './helpers/api';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3002';

test.describe('Cash PIN flow (API)', () => {
  test('crear acuerdo + confirmar PIN bilateral', async ({ request }) => {
    const buyerToken = await legacyLogin(request, apiUrl, '+213555222222');
    const sellerToken = await legacyLogin(request, apiUrl, '+213555333333');

    const sellerMe = await request.get(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    // /auth/me may not exist — resolve seller id via sync
    const sellerSync = await request.post(`${apiUrl}/auth/sync`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(sellerSync.ok()).toBeTruthy();
    const sellerBody = (await sellerSync.json()) as {
      user?: { id?: string; sub?: string };
      sub?: string;
      id?: string;
    };
    const sellerId = sellerBody.user?.id ?? sellerBody.user?.sub ?? sellerBody.sub ?? sellerBody.id;
    expect(sellerId).toBeTruthy();

    const create = await request.post(`${apiUrl}/cash/agreements`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { sellerId, amount: 1500, method: 'cash' },
    });
    expect(create.ok()).toBeTruthy();
    const agreement = (await create.json()) as {
      operationCode: string;
      pin?: string;
      hasPin?: boolean;
    };
    expect(agreement.operationCode).toMatch(/^CASH-/);
    expect(agreement.pin).toBeUndefined();

    const sellerView = await request.get(`${apiUrl}/cash/${agreement.operationCode}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    expect(sellerView.ok()).toBeTruthy();
    const withPin = (await sellerView.json()) as { pin?: string };
    expect(withPin.pin).toMatch(/^\d{4}$/);

    const buyerConfirm = await request.post(`${apiUrl}/cash/confirm`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { operationCode: agreement.operationCode, pin: withPin.pin },
    });
    expect(buyerConfirm.ok()).toBeTruthy();

    const sellerConfirm = await request.post(`${apiUrl}/cash/confirm`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { operationCode: agreement.operationCode, pin: withPin.pin },
    });
    expect(sellerConfirm.ok()).toBeTruthy();
    const done = (await sellerConfirm.json()) as { fullyConfirmed?: boolean };
    expect(done.fullyConfirmed).toBe(true);
  });
});

test.describe('Publish listing UI smoke', () => {
  test('página create exige auth o muestra formulario', async ({ page }) => {
    await page.goto(`${webUrl}/marketplace/create`);
    await page.waitForURL(/sign-in|marketplace\/create/, { timeout: 15_000 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin smoke', () => {
  test('admin sign-in page carga', async ({ page }) => {
    await page.goto(`${adminUrl}/sign-in`).catch(async () => {
      await page.goto(`${adminUrl}/`);
    });
    await expect(page.locator('body')).toBeVisible();
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(10);
  });
});
