/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lefrig/ui', '@lefrig/shared'],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ondigitalocean.app' },
      { protocol: 'https', hostname: '**.digitaloceanspaces.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'cdn.lefrig.com' },
      { protocol: 'https', hostname: 'api.lefrig.com', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
    ],
  },
  // Solo para imagen Docker — Vercel no necesita standalone
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
