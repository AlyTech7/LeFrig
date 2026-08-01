const fs = require('fs');
const https = require('https');

function loadSecret() {
  if (process.env.CLERK_SECRET_KEY) return process.env.CLERK_SECRET_KEY.trim();
  const line = fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('CLERK_SECRET_KEY='));
  if (!line) throw new Error('no key');
  return line.slice('CLERK_SECRET_KEY='.length).trim().replace(/^["']|["']$/g, '');
}

function req(secret, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
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
  const secret = loadSecret();
  console.log('prefix', secret.slice(0, 8), 'len', secret.length);

  const instance = await req(secret, 'GET', '/instance');
  console.log('instance', instance.status, instance.body.slice(0, 500));

  const phone = await req(secret, 'GET', '/phone_numbers?limit=1');
  console.log('phone', phone.status, phone.body.slice(0, 300));

  const svix = await req(secret, 'POST', '/webhooks/svix_url', {});
  console.log('svix_url', svix.status, svix.body.slice(0, 800));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
