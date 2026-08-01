const { execSync } = require('child_process');
const fs = require('fs');

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

console.log('vercel whoami:', sh('npx --yes vercel@latest whoami').trim());

try {
  console.log('--- projects ---');
  console.log(sh('npx --yes vercel@latest project ls'));
} catch (e) {
  console.log('project ls failed', e.stderr || e.message);
}

const envPath = '.env';
if (fs.existsSync(envPath)) {
  const t = fs.readFileSync(envPath, 'utf8');
  for (const key of ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']) {
    const m = t.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (m) {
      const v = m[1].trim().replace(/^["']|["']$/g, '');
      console.log(`${key} prefix=${v.slice(0, 8)} len=${v.length}`);
    }
  }
}
if (process.env.CLERK_SECRET_KEY) {
  const v = process.env.CLERK_SECRET_KEY;
  console.log(`process.env CLERK_SECRET_KEY prefix=${v.slice(0, 8)} len=${v.length}`);
}
