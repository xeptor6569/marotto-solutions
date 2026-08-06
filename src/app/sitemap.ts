import type { MetadataRoute } from 'next';
import { getSiteUrl, marketingServices } from '@/lib/marketing';

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = getSiteUrl();

    return [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        ...marketingServices.map((service) => ({
            url: `${siteUrl}/services/${service.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
    ];
}
