import type { MetadataRoute } from 'next';
import { isProductionEnvironment } from '@/lib/app-env';
import { getPublicSite, getSiteUrl } from '@/lib/branding';

// Evaluated per request rather than baked at build time, so the noindex below
// is decided by the environment the container is actually running in.
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const siteUrl = getSiteUrl();

    // A non-production instance serves the same marketing pages on a different
    // hostname. Letting it be indexed would compete with the real site for the
    // local search terms it is built around, so keep dev out of the index
    // entirely and do not advertise a sitemap for it.
    // Installs that disabled the public site have nothing indexable either.
    const publicSite = await getPublicSite();
    if (!isProductionEnvironment() || !publicSite.enabled) {
        return {
            rules: {
                userAgent: '*',
                disallow: '/',
            },
        };
    }

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/api/',
                '/auth/',
                '/d/',
                '/contracts/',
                '/estimates/',
                '/invoices/',
                '/quotes/',
                '/receipts/',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
