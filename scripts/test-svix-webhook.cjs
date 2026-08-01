const { chromium } = require('playwright');
const https = require('https');

const secret = process.env.CLERK_SECRET_KEY;
const APP = 'app_3GPC9L6XPibSpRZRsANoIIg7iu6';
const EP = 'ep_3GPCMdkkcwv9evyq6HoKVQIommJ';
const EP_URL = `https://app.svix.com/api/eu/api/v1/app/${APP}/endpoint/${EP}`;

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
  const page = await browser.newPage();

  let authToken = null;
  page.on('response', async (res) => {
    if (res.url().includes('/auth/one-time-token') && res.status() === 200) {
      try {
        const j = await res.json();
        authToken = j.token;
      } catch {
        /* ignore */
      }
    }
  });

  await page.goto(portalUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (!authToken) throw new Error('no svix token');

  const get = await page.request.get(EP_URL, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const ep = await get.json();
  console.log('endpoint', { disabled: ep.disabled, url: ep.url });

  // Send example from Testing tab UI
  await page.goto(`https://app.svix.com/${APP}/endpoints/${EP}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const testing = page.getByRole('tab', { name: /Testing/i }).or(page.getByText('Testing', { exact: true }));
  if (await testing.count()) {
    await testing.first().click();
    await page.waitForTimeout(1000);
  }
  const send = page.getByRole('button', { name: /Send Example|Send Message|Send/i }).first();
  if (await send.count()) {
    await send.click();
    await page.waitForTimeout(4000);
    console.log('sent example');
  } else {
    // API send-example
    const sendUrl = `${EP_URL}/send-example`;
    const resp = await page.request.post(sendUrl, {
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      data: { eventType: 'user.updated' },
    });
    console.log('send-example', resp.status(), (await resp.text()).slice(0, 300));
  }

  await page.waitForTimeout(3000);
  const attempts = await page.request.get(
    `https://app.svix.com/api/eu/api/v1/app/${APP}/attempt/endpoint/${EP}?limit=5&with_msg=true`,
    { headers: { Authorization: `Bearer ${authToken}` } },
  );
  const aj = await attempts.json();
  for (const a of (aj.data || []).slice(0, 3)) {
    console.log('attempt', a.statusText || a.status, a.responseStatusCode, (a.url || '').slice(0, 60), (a.response || '').slice(0, 120));
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
