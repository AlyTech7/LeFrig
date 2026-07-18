import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lefrig.com';
  const routes = [
    '',
    '/marketplace',
    '/shops',
    '/services',
    '/transport',
    '/search',
    '/community',
    '/jobs',
    '/needs',
    '/camps',
    '/locations',
    '/legal',
  ];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
