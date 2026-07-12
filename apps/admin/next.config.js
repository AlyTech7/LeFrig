/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lefrig/ui', '@lefrig/shared'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ondigitalocean.app' },
      { protocol: 'https', hostname: '**.digitaloceanspaces.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
