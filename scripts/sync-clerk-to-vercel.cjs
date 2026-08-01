const { spawnSync } = require('child_process');

const secret = process.env.CLERK_SECRET_KEY;
if (!secret) {
  console.error('missing CLERK_SECRET_KEY');
  process.exit(1);
}

function vercel(args) {
  console.log('>', args.join(' '));
  const r = spawnSync('npx', ['--yes', 'vercel@latest', ...args], {
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.stdout) process.stdout.write(r.stdout.slice(0, 1500));
  if (r.stderr) process.stderr.write(r.stderr.slice(0, 800));
  return r.status ?? 1;
}

for (const project of ['lefrig', 'lefrig-admin']) {
  console.log('\n===', project, '===');
  vercel(['env', 'rm', 'CLERK_SECRET_KEY', 'production', '--project', project, '--yes']);
  const code = vercel([
    'env',
    'add',
    'CLERK_SECRET_KEY',
    'production',
    '--project',
    project,
    '--value',
    secret,
    '--yes',
    '--sensitive',
    '--force',
  ]);
  console.log('status', code);
}
