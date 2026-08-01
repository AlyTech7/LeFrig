const https = require('https');

const secret = process.env.CLERK_SECRET_KEY;

function req(method, path, body) {
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

async function main() {
  const cur = JSON.parse((await req('GET', '/instance/communication')).body);
  const blocked = (cur.blocked_country_codes || []).filter((c) => c !== 'DZ' && c !== 'MR');
  console.log('unblocking DZ and MR; remaining blocked count', blocked.length);

  const patched = await req('PATCH', '/instance/communication', {
    blocked_country_codes: blocked,
  });
  console.log('patch', patched.status);
  const after = JSON.parse(patched.body);
  console.log('DZ blocked?', after.blocked_country_codes.includes('DZ'));
  console.log('MR blocked?', after.blocked_country_codes.includes('MR'));

  // Ensure production API webhook exists via Svix app portal token exchange if possible
  const svixRes = await req('POST', '/webhooks/svix_url', {});
  const { svix_url } = JSON.parse(svixRes.body);
  const hash = decodeURIComponent(svix_url.split('#key=')[1] || '');
  const portal = JSON.parse(Buffer.from(hash, 'base64').toString('utf8'));
  console.log('svix app', portal.appId, 'region', portal.region);

  // Try Svix app portal access API
  const tokenBody = JSON.stringify({
    // some Svix versions accept the one-time token in header
  });
  await new Promise((resolve) => {
    const r = https.request(
      {
        hostname: portal.region === 'eu' ? 'api.eu.svix.com' : 'api.us.svix.com',
        path: `/api/v1/auth/app-portal-access/${portal.appId}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${portal.oneTimeToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(tokenBody),
        },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          console.log('svix portal-access', res.statusCode, b.slice(0, 500));
          resolve();
        });
      },
    );
    r.on('error', (e) => {
      console.log('svix error', e.message);
      resolve();
    });
    r.write(tokenBody);
    r.end();
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
