const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const {
  webhookUrl,
  requireClerkSvixApp,
  requireClerkSvixEndpoint,
  requireDoAppIds,
} = require('./ops/config.cjs');

const clerkSecret = process.env.CLERK_SECRET_KEY;
const APP = requireClerkSvixApp();
const EP = requireClerkSvixEndpoint();
const WEBHOOK_URL = webhookUrl();

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

function sign(payload, secret) {
  const id = `msg_probe_${Date.now()}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `${id}.${timestamp}.${payload}`;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = crypto.createHmac('sha256', key).update(toSign).digest('base64');
  return { id, timestamp, signature: `v1,${signature}` };
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
        authToken = (await res.json()).token;
      } catch {
        /* ignore */
      }
    }
  });
  await page.goto(portalUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  if (!authToken) throw new Error('no token');

  const secRes = await page.request.get(
    `https://app.svix.com/api/eu/api/v1/app/${APP}/endpoint/${EP}/secret`,
    { headers: { Authorization: `Bearer ${authToken}` } },
  );
  const secBody = await secRes.json();
  console.log('secret status', secRes.status(), 'keys', Object.keys(secBody));
  const signingSecret = secBody.key || secBody.secret || secBody.signingSecret;
  console.log('secret len', signingSecret?.length, 'prefix', signingSecret?.slice(0, 8));
  fs.writeFileSync('.tmp-CLERK_WEBHOOK_SECRET.txt', signingSecret, 'utf8');

  // Also rotate secret if needed? keep current
  const payload = JSON.stringify({
    type: 'user.updated',
    data: {
      id: 'user_webhook_probe_lefrig',
      email_addresses: [{ email_address: 'webhook-probe@lefrig.test', id: 'idn_probe' }],
      phone_numbers: [],
      first_name: 'Webhook',
      last_name: 'Probe',
      image_url: null,
      public_metadata: {},
      unsafe_metadata: {},
      private_metadata: {},
    },
  });
  const { id, timestamp, signature } = sign(payload, signingSecret);
  const post = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': id,
      'svix-timestamp': String(timestamp),
      'svix-signature': signature,
    },
    body: payload,
  });
  console.log('webhook', post.status, await post.text());

  // Sync secret to DO again
  const { execSync } = require('child_process');
  for (const appId of requireDoAppIds()) {
    let y = execSync(`doctl apps spec get ${appId} -o yaml`, { encoding: 'utf8' }).replace(/^\uFEFF/, '');
    const re =
      /(^[ \t]*- key: CLERK_WEBHOOK_SECRET\r?\n[ \t]*scope: RUN_TIME\r?\n[ \t]*type: SECRET\r?\n[ \t]*value: ).+$/m;
    y = y.replace(re, `$1${signingSecret}`);
    const file = `.tmp-do-webhook-${appId}.yaml`;
    fs.writeFileSync(file, y, 'utf8');
    execSync(`doctl apps update ${appId} --spec ${file}`, { stdio: 'inherit' });
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
