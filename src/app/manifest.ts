import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        // Keep name + short_name identical and short so iOS Spotlight / home-screen
        // search matches on "M" / "Ma" / "Mar…" instead of requiring "Marotto S…".
        id: '/admin',
        name: 'Marotto',
        short_name: 'Marotto',
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
