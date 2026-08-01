const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

const secret = process.env.CLERK_SECRET_KEY;
const WEBHOOK_URL = 'https://whale-app-xpe4g.ondigitalocean.app/auth/clerk/webhook';
const EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'session.created',
  'session.ended',
  'session.removed',
  'session.revoked',
];

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
        res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function svix(host, method, path, token, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = https.request(
      {
        hostname: host,
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
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

async function main() {
  if (!secret) throw new Error('CLERK_SECRET_KEY missing');

  const portalRes = await clerk('POST', '/webhooks/svix_url', {});
  if (portalRes.status !== 200) {
    console.error('svix_url failed', portalRes.status, portalRes.body);
    process.exit(1);
  }
  const { svix_url } = JSON.parse(portalRes.body);
  const keyB64 = decodeURIComponent(svix_url.split('#key=')[1] || '');
  const portal = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));
  const host = portal.region === 'eu' ? 'api.eu.svix.com' : 'api.us.svix.com';
  console.log('svix app', portal.appId, host);

  // Exchange one-time token for API access (try several auth styles)
  const attempts = [
    ['POST', `/api/v1/auth/app-portal-access/${portal.appId}`, portal.oneTimeToken, {}],
    ['POST', `/api/v1/auth/app-portal-access/${portal.appId}`, null, { token: portal.oneTimeToken }],
    ['GET', `/api/v1/app/${portal.appId}/endpoint`, portal.oneTimeToken, undefined],
  ];

  let apiToken = null;
  for (const [method, path, bearer, body] of attempts) {
    const r = await svix(host, method, path, bearer || 'unused', body);
    console.log('attempt', method, path, r.status, r.body.slice(0, 200));
    try {
      const j = JSON.parse(r.body);
      if (j.token || j.accessToken || j.key) {
        apiToken = j.token || j.accessToken || j.key;
        console.log('got api token');
        break;
      }
      if (Array.isArray(j.data) || j.id) {
        // listing worked with oneTimeToken as bearer
        apiToken = bearer;
        break;
      }
    } catch {
      /* ignore */
    }
  }

  // Also try ingesting via Clerk-documented pattern: list endpoints with app id + magic
  if (!apiToken) {
    // Create endpoint using Svix Consumer App Portal JWT flow:
    // POST /api/v1/app/{app_id}/endpoint with Authorization: Bearer <oneTimeToken>
    apiToken = portal.oneTimeToken;
  }

  const list = await svix(host, 'GET', `/api/v1/app/${portal.appId}/endpoint`, apiToken);
  console.log('list endpoints', list.status, list.body.slice(0, 800));

  let endpoints = [];
  try {
    const j = JSON.parse(list.body);
    endpoints = j.data || j || [];
    if (!Array.isArray(endpoints)) endpoints = [];
  } catch {
    endpoints = [];
  }

  let endpoint = endpoints.find((e) => (e.url || '').includes('/auth/clerk/webhook'));
  if (!endpoint) {
    const created = await svix(host, 'POST', `/api/v1/app/${portal.appId}/endpoint`, apiToken, {
      url: WEBHOOK_URL,
      version: 1,
      description: 'LeFrig API production Clerk sync',
      filterTypes: EVENTS,
    });
    console.log('create endpoint', created.status, created.body.slice(0, 1000));
    if (created.status >= 200 && created.status < 300) {
      endpoint = JSON.parse(created.body);
    } else {
      // retry without filterTypes
      const created2 = await svix(host, 'POST', `/api/v1/app/${portal.appId}/endpoint`, apiToken, {
        url: WEBHOOK_URL,
        description: 'LeFrig API production Clerk sync',
      });
      console.log('create endpoint retry', created2.status, created2.body.slice(0, 1000));
      if (created2.status >= 200 && created2.status < 300) {
        endpoint = JSON.parse(created2.body);
      }
    }
  } else {
    console.log('endpoint already exists', endpoint.id, endpoint.url);
  }

  if (!endpoint?.id) {
    console.error('Could not create/find endpoint');
    process.exit(1);
  }

  // Get signing secret
  const secretRes = await svix(
    host,
    'GET',
    `/api/v1/app/${portal.appId}/endpoint/${endpoint.id}/secret`,
    apiToken,
  );
  console.log('secret status', secretRes.status, secretRes.body.slice(0, 200));
  let signingSecret = null;
  try {
    const j = JSON.parse(secretRes.body);
    signingSecret = j.key || j.secret || j.signingSecret;
  } catch {
    /* ignore */
  }

  if (!signingSecret) {
    // rotate to get secret
    const rot = await svix(
      host,
      'POST',
      `/api/v1/app/${portal.appId}/endpoint/${endpoint.id}/secret/rotate`,
      apiToken,
      {},
    );
    console.log('rotate', rot.status, rot.body.slice(0, 300));
    try {
      signingSecret = JSON.parse(rot.body).key;
    } catch {
      /* ignore */
    }
  }

  if (!signingSecret) {
    console.error('No signing secret obtained');
    process.exit(1);
  }

  fs.writeFileSync('.tmp-CLERK_WEBHOOK_SECRET.txt', signingSecret, 'utf8');
  console.log('Wrote .tmp-CLERK_WEBHOOK_SECRET.txt len', signingSecret.length);

  // Sync to DO prod + staging
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
    if (!re.test(y)) {
      console.error('CLERK_WEBHOOK_SECRET block missing in', appId);
      continue;
    }
    y = y.replace(re, `$1${signingSecret}`);
    const file = `.tmp-do-webhook-${appId}.yaml`;
    fs.writeFileSync(file, y, 'utf8');
    execSync(`doctl apps update ${appId} --spec ${file}`, { stdio: 'inherit' });
    console.log('Updated CLERK_WEBHOOK_SECRET on', appId);
  }

  console.log('WEBHOOK_DONE', WEBHOOK_URL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
