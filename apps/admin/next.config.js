const { withSentryConfig } = require('@sentry/nextjs');

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

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'lefrig-admin',
  silent: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
};

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
