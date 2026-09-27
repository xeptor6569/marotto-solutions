import type { MetadataRoute } from 'next';
import { getBusiness } from '@/lib/branding';

// The manifest is built from user-configured branding at request time.
export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const business = await getBusiness();
    // Keep name + short_name identical and short so iOS Spotlight / home-screen
    // search matches on the first characters instead of requiring the full name.
    const shortName = business.name.split(/\s+/)[0] || business.name;

    return {
        id: '/admin',
        name: shortName,
        short_name: shortName,
        description: 'Admin for jobs, invoices, clients, and calendar.',
        start_url: '/admin',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        background_color: '#111113',
        theme_color: '#111113',
        orientation: 'portrait-primary',
        lang: 'en-US',
        categories: ['business', 'productivity'],
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-192-maskable.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/icon-512-maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'New invoice',
                short_name: 'Invoice',
                description: 'Create a new invoice',
                url: '/admin/invoices/new',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Jobs',
                short_name: 'Jobs',
                description: 'Open jobs',
                url: '/admin/jobs',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Calendar',
                short_name: 'Calendar',
                description: 'Open the work calendar',
                url: '/admin/calendar',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
                name: 'Clients',
                short_name: 'Clients',
                description: 'Open clients',
                url: '/admin/clients',
                icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
        ],
    };
}
