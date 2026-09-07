import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logiflow.io';
  const lastModified = new Date();

  const routes = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/dashboard', priority: 0.9, changeFrequency: 'always' as const },
    { url: '/tracking', priority: 0.9, changeFrequency: 'always' as const },
    { url: '/vehicles', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/orders', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/drivers', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/invoices', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/allocation', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/delivery', priority: 0.7, changeFrequency: 'daily' as const },
    { url: '/warehouse', priority: 0.6, changeFrequency: 'weekly' as const },
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
