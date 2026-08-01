const fs = require('fs');
const { execSync } = require('child_process');

const appId = process.argv[2];
const secret = process.env.CLERK_SECRET_KEY;
if (!appId || !secret) {
  console.error('Usage: CLERK_SECRET_KEY=... node sync-clerk-to-do.cjs <app-id>');
  process.exit(1);
}

let y = execSync(`doctl databases version`, { encoding: 'utf8' }); // warmup
y = execSync(`doctl apps spec get ${appId} -o yaml`, { encoding: 'utf8' }).replace(/^\uFEFF/, '');

if (!y.includes('CLERK_SECRET_KEY')) {
  console.error('CLERK_SECRET_KEY not in spec');
  process.exit(1);
}

// Replace plaintext or EV[] value for CLERK_SECRET_KEY block with new plaintext secret
const re =
  /(^[ \t]*- key: CLERK_SECRET_KEY\r?\n[ \t]*scope: RUN_TIME\r?\n[ \t]*type: SECRET\r?\n[ \t]*value: ).+$/m;
if (!re.test(y)) {
  console.error('Could not match CLERK_SECRET_KEY value line');
  process.exit(1);
}
y = y.replace(re, `$1${secret}`);
fs.writeFileSync(`.tmp-do-clerk-${appId}.yaml`, y, 'utf8');
execSync(`doctl apps update ${appId} --spec .tmp-do-clerk-${appId}.yaml`, { stdio: 'inherit' });
console.log('Updated CLERK_SECRET_KEY on', appId);
