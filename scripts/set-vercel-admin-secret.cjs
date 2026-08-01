const { spawnSync } = require('child_process');
const fs = require('fs');

const secret = fs.readFileSync('.tmp-ADMIN_SESSION_SECRET.txt', 'utf8').trim();
if (!secret || secret.length < 32) {
  console.error('Missing .tmp-ADMIN_SESSION_SECRET.txt');
  process.exit(1);
}

function vercel(args) {
  console.log('>', 'vercel', args.join(' '));
  const r = spawnSync('npx', ['--yes', 'vercel@latest', ...args], {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

console.log('=== env ls lefrig-admin ===');
vercel(['env', 'ls', '--project', 'lefrig-admin', '--format', 'json']);

console.log('=== rm existing ADMIN_SESSION_SECRET (ignore fail) ===');
vercel(['env', 'rm', 'ADMIN_SESSION_SECRET', 'production', '--project', 'lefrig-admin', '--yes']);

console.log('=== add ADMIN_SESSION_SECRET production ===');
const code = vercel([
  'env',
  'add',
  'ADMIN_SESSION_SECRET',
  'production',
  '--project',
  'lefrig-admin',
  '--value',
  secret,
  '--yes',
  '--sensitive',
  '--force',
]);

if (code !== 0) process.exit(code);

console.log('=== env ls lefrig-admin (after) ===');
vercel(['env', 'ls', '--project', 'lefrig-admin']);
console.log('DONE');
