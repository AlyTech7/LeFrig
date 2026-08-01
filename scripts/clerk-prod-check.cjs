const { spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');

function vercel(args) {
  const r = spawnSync('npx', ['--yes', 'vercel@latest', ...args], {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function loadEnvFile() {
  const out = {};
  if (!fs.existsSync('.env')) return out;
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function clerkGet(path, secret) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.clerk.com',
        path: `/v1${path}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({ status: res.statusCode, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function clerkPost(path, secret, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'api.clerk.com',
        path: `/v1${path}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== vercel env ls lefrig (web) ===');
  vercel(['env', 'ls', '--project', 'lefrig', '--format', 'json']);

  const fileEnv = loadEnvFile();
  const secret = process.env.CLERK_SECRET_KEY || fileEnv.CLERK_SECRET_KEY;
  if (!secret) {
    console.error('No CLERK_SECRET_KEY');
    process.exit(1);
  }
  console.log('Clerk secret prefix', secret.slice(0, 8));

  // Instance / phone / webhooks via Backend API
  for (const path of ['/users?limit=1', '/webhooks', '/phone_numbers?limit=1', '/instance']) {
    try {
      const r = await clerkGet(path, secret);
      console.log('GET', path, '->', r.status, r.body.slice(0, 300));
    } catch (e) {
      console.log('GET', path, 'error', e.message);
    }
  }

  // Ensure webhook to production API if missing
  const apiUrl = 'https://whale-app-xpe4g.ondigitalocean.app/auth/clerk/webhook';
  const list = await clerkGet('/webhooks', secret);
  console.log('webhooks list status', list.status);
  let has = false;
  try {
    const parsed = JSON.parse(list.body);
    const arr = Array.isArray(parsed) ? parsed : parsed?.data || [];
    has = arr.some((w) => (w.callback_url || w.url || '').includes('whale-app-xpe4g') || (w.callback_url || w.url || '').includes('/auth/clerk/webhook'));
    console.log(
      'existing webhooks',
      arr.map((w) => ({ id: w.id, url: w.callback_url || w.url, events: w.event_types || w.events })),
    );
  } catch {
    /* ignore */
  }

  if (!has && list.status === 200) {
    console.log('Creating Clerk webhook ->', apiUrl);
    const created = await clerkPost('/webhooks', secret, {
      url: apiUrl,
      event_types: [
        'user.created',
        'user.updated',
        'user.deleted',
        'session.created',
        'session.ended',
      ],
    });
    console.log('create webhook', created.status, created.body.slice(0, 500));
  } else if (has) {
    console.log('Webhook already points at API (or similar)');
  }

  console.log('CLERK_DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
