import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logisticsedge.io';
  const lastModified = new Date();

  // Only public-facing, unauthenticated pages belong in sitemap
  // Dashboard/app routes (/orders, /tracking, etc.) are auth-protected — excluded
  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/pricing', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/for/fleet-owners', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/for/transporters', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/for/3pl', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/compare/excel-and-whatsapp', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/compare/gps-devices', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/trust', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/track', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/terms', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/cookies', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/refund', priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  return routes.map(r => ({
    url: `${baseUrl}${r.url}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
