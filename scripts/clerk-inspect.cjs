const https = require('https');

const secret = process.env.CLERK_SECRET_KEY;
if (!secret) {
  console.error('CLERK_SECRET_KEY missing');
  process.exit(1);
}

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
  for (const [m, p, body] of [
    ['GET', '/domains'],
    ['GET', '/instance/communication'],
    ['GET', '/instance'],
    ['PATCH', '/instance/communication', {}],
  ]) {
    const r = await req(m, p, body);
    console.log('\n===', m, p, '->', r.status);
    console.log(r.body.slice(0, 1200));
  }

  // Svix: try create endpoint via Clerk-managed flow isn't direct.
  // List if we can get auth token somehow.
  const svix = await req('POST', '/webhooks/svix_url', {});
  console.log('\n=== svix_url', svix.status);
  console.log(svix.body);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
