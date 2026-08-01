const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const clerkSecret = process.env.CLERK_SECRET_KEY;
const APP = 'app_3GPC9L6XPibSpRZRsANoIIg7iu6';
const EP = 'ep_3GPCMdkkcwv9evyq6HoKVQIommJ';

function clerk(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = https.request(
      {
        hostname: 'api.clerk.com',
        path: `/v1${path}`,
        method,
        headers: {
          Authorization: `Bearer ${clerkSecret}`,
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

function syncSecret(key) {
  fs.writeFileSync('.tmp-CLERK_WEBHOOK_SECRET.txt', key, 'utf8');
  for (const appId of [
    '280fb860-39ef-44df-b721-7ca8be74f532',
    '4d6fbbd0-7390-42cb-838e-46bfc2828669',
  ]) {
    let y = execSync(`doctl apps spec get ${appId} -o yaml`, { encoding: 'utf8' }).replace(
      /^\uFEFF/,
      '',
    );
    const re =
      /(^[ \t]*- key: CLERK_WEBHOOK_SECRET\r?\n[ \t]*scope: RUN_TIME\r?\n[ \t]*type: SECRET\r?\n[ \t]*value: ).+$/m;
    if (!re.test(y)) throw new Error(`no CLERK_WEBHOOK_SECRET in ${appId}`);
    y = y.replace(re, (_, p1) => p1 + key);
    const file = `.tmp-do-webhook-${appId}.yaml`;
    fs.writeFileSync(file, y, 'utf8');
    if (!fs.readFileSync(file, 'utf8').includes(key)) throw new Error(`secret missing in ${file}`);
    execSync(`doctl apps update ${appId} --spec ${file}`, { stdio: 'inherit' });
    console.log('DO synced', appId);
  }
}

(async () => {
  const portalUrl = JSON.parse((await clerk('POST', '/webhooks/svix_url', {})).body).svix_url;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = null;
  page.on('response', async (res) => {
    if (res.url().includes('/auth/one-time-token') && res.status() === 200) {
      try {
        token = (await res.json()).token;
      } catch {
        /* ignore */
      }
    }
  });
  await page.goto(portalUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (!token) throw new Error('no token');

  const rot = await page.request.post(
    `https://app.svix.com/api/eu/api/v1/app/${APP}/endpoint/${EP}/secret/rotate`,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: {} },
  );
  console.log('rotate', rot.status(), (await rot.text()).slice(0, 200));

  const sec = await page.request.get(
    `https://app.svix.com/api/eu/api/v1/app/${APP}/endpoint/${EP}/secret`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const { key } = await sec.json();
  console.log('new secret len', key.length);
  syncSecret(key);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
