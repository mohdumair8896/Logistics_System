import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logiflow.io';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/widget-frame/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
