const { chromium } = require('playwright');
const https = require('https');
const {
  requireClerkSvixApp,
  requireClerkSvixEndpoint,
} = require('./ops/config.cjs');

const secret = process.env.CLERK_SECRET_KEY;
const APP = requireClerkSvixApp();
const EP = requireClerkSvixEndpoint();
const PATCH_URL = `https://app.svix.com/api/eu/api/v1/app/${APP}/endpoint/${EP}`;

function clerk(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = https.request(
      {
        hostname: 'api.clerk.com',
        path: `/v1${path}`,
        method,
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const r = await clerk('POST', '/webhooks/svix_url', {});
  const portalUrl = JSON.parse(r.body).svix_url;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let authToken = null;
  page.on('response', async (res) => {
    if (res.url().includes('/auth/one-time-token') && res.status() === 200) {
      try {
        const j = await res.json();
        console.log('one-time-token keys', Object.keys(j || {}));
        authToken = j.token || j.accessToken || j.access_token || j.key || null;
        if (authToken) console.log('got token prefix', String(authToken).slice(0, 12));
        else console.log('token body', JSON.stringify(j).slice(0, 300));
      } catch {
        /* ignore */
      }
    }
  });

  await page.goto(portalUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Enable via in-page fetch (session cookies)
  const result = await page.evaluate(async (patchUrl) => {
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ disabled: false }),
    });
    const text = await res.text();
    return { status: res.status, text: text.slice(0, 500) };
  }, PATCH_URL);
  console.log('in-page patch', result);

  if (result.status >= 400 && authToken) {
    const res2 = await page.request.patch(PATCH_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: { disabled: false },
    });
    console.log('token patch', res2.status(), (await res2.text()).slice(0, 300));
  }

  // Verify
  const verify = await page.evaluate(async (patchUrl) => {
    const res = await fetch(patchUrl, { credentials: 'include' });
    return await res.json();
  }, PATCH_URL);
  console.log('disabled?', verify.disabled, 'url', verify.url);

  await browser.close();
  if (verify.disabled) process.exit(2);
  console.log('ENDPOINT_ENABLED');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
