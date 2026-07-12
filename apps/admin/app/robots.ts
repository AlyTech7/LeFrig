import type { MetadataRoute } from 'next';

/** Panel interno — no indexar en buscadores */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
