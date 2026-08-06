import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/marketing';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = getSiteUrl();

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
