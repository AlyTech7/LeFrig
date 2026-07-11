/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lefrig/ui', '@lefrig/shared'],
  reactStrictMode: true,
  // Solo para imagen Docker — Vercel no necesita standalone
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
