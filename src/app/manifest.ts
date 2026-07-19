import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Marotto Solutions Admin',
        short_name: 'Marotto',
        description: 'Admin dashboard for Marotto Solutions documents, jobs, and clients.',
        start_url: '/admin',
        display: 'standalone',
        background_color: '#111113',
        theme_color: '#111113',
        orientation: 'portrait-primary',
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
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
