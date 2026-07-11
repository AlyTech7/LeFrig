import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lefrig.com';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/orders', '/messages', '/ledger', '/cash'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
