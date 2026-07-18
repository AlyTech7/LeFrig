import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lefrig.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/orders', '/messages', '/diaspora', '/cash', '/me'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
