import type { MetadataRoute } from 'next';
import { getPublicSite, getSiteUrl } from '@/lib/branding';

// Services are user-configured at runtime, so the sitemap is built per request.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl();
    const publicSite = await getPublicSite();

    if (!publicSite.enabled) {
        return [];
    }

    return [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        ...publicSite.services.map((service) => ({
            url: `${siteUrl}/services/${service.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        })),
    ];
}
