const fs = require('fs');
const { execSync } = require('child_process');
const { requireDoAppId } = require('./ops/config.cjs');

const appId = requireDoAppId();
const secret = fs.readFileSync('.tmp-ADMIN_SESSION_SECRET.txt', 'utf8').trim();

let y = execSync(`doctl apps spec get ${appId} -o yaml`, { encoding: 'utf8' }).replace(/^\uFEFF/, '');

if (y.includes('ADMIN_SESSION_SECRET')) {
  console.log('ADMIN_SESSION_SECRET already in live spec');
  process.exit(0);
}

const anchor = '  - key: CLERK_WEBHOOK_SECRET';
const idx = y.indexOf(anchor);
if (idx < 0) {
  console.error('anchor CLERK_WEBHOOK_SECRET not found');
  process.exit(1);
}

const insert = `  - key: ADMIN_SESSION_SECRET
    scope: RUN_TIME
    type: SECRET
    value: ${secret}
  - key: CLERK_AUTHORIZED_PARTIES
    scope: RUN_TIME
    value: https://www.lefrig.com,https://lefrig.com,https://admin.lefrig.com,https://lefrig.vercel.app,https://lefrig-admin.vercel.app
`;

y = y.slice(0, idx) + insert + y.slice(idx);
fs.writeFileSync('.tmp-do-app-prod.yaml', y, 'utf8');

// sanity: ADMIN must appear before WEBHOOK
const a = y.indexOf('ADMIN_SESSION_SECRET');
const w = y.indexOf('CLERK_WEBHOOK_SECRET');
if (a < 0 || w < 0 || a > w) {
  console.error('sanity failed', { a, w });
  process.exit(1);
}

execSync(`doctl apps update ${appId} --spec .tmp-do-app-prod.yaml`, { stdio: 'inherit' });
console.log('App update submitted');
