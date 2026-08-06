import type {
    BrandingConfig,
    BusinessConfig,
    PublicSiteConfig,
} from './types';

/**
 * The original Marotto Solutions branding, kept only as a one-time migration
 * source: installs that predate the white-label settings (an existing
 * settings.json without a `business` section) are seeded with these values so
 * a deploy does not silently unbrand a live site. Fresh installs never see
 * this — they start from the neutral defaults in config.ts.
 */

export const LEGACY_BUSINESS: BusinessConfig = {
    name: 'Marotto Solutions',
    legalName: 'Marotto Solutions',
    tagline: 'Expert General Contracting & IT Services',
    phoneDisplay: '(570) 332-9262',
    phoneE164: '+15703329262',
    email: '',
    addressLine1: '28 E Mountain Ridge MHP',
    addressLine2: 'Wilkes Barre, PA 18702',
    serviceArea: 'Pittston, Wilkes-Barre, and surrounding Northeast Pennsylvania communities',
};

export const LEGACY_BRANDING: BrandingConfig = {
    themePreset: 'classic-indigo',
    defaultAppearance: 'dark',
    letterheadLine1: 'MAROTTO',
    letterheadLine2: 'SOLUTIONS',
    documentAccentColor: '#1e3a5f',
};

export const LEGACY_WEBDAV_ROOT_PATH = '/MarottoSolutions';

export const LEGACY_PUBLIC_SITE: PublicSiteConfig = {
    enabled: true,
    heroHeading: 'Expert General Contracting & IT Services',
    heroSubheading: 'Home renovations, custom PC builds, networking, and automation — one call covers it all.',
    seoTitle: 'Marotto Solutions | Contracting & IT Services',
    seoDescription: 'General contracting and IT services in Pittston, PA — home renovations, networking, custom PC builds, and automation.',
    seoKeywords: [
        'general contractor Pittston PA',
        'contractor Wilkes-Barre PA',
        'IT services Pittston PA',
        'small business networking Wilkes-Barre',
        'custom PC builds Northeast Pennsylvania',
    ],
    highlights: [
        {
            title: 'Physical & Digital, One Partner',
            text: 'No more juggling separate contractors for your renovation and your network. One call covers both.',
            icon: 'wrench',
        },
        {
            title: 'Local & Personal',
            text: 'Based in Pittston, PA. You deal directly with the person doing the work — no runaround, no call centers.',
            icon: 'users',
        },
        {
            title: 'Fast Turnaround',
            text: 'Small operation means quick response times. We get in, get it done right, and get you back to business.',
            icon: 'zap',
        },
    ],
    services: [
        {
            slug: 'general-contracting',
            formValue: 'general',
            title: 'General Contracting in Northeast Pennsylvania',
            shortTitle: 'General Contracting',
            description: 'Home repairs, renovations, and custom installations for homeowners in Pittston, Wilkes-Barre, and nearby communities.',
            summary: 'From targeted repairs to room updates, get practical help planning and completing improvements around your home.',
            highlights: [
                'Drywall repair and painting',
                'Flooring installation and replacement',
                'Kitchen and bathroom updates',
                'Deck, fence, and custom installation work',
            ],
            idealFor: [
                'Homeowners with a repair list that needs attention',
                'Property owners preparing a space for move-in or rental',
                'Customers planning a focused room or exterior update',
            ],
            icon: 'hammer',
        },
        {
            slug: 'it-networking',
            formValue: 'it',
            title: 'IT & Networking Services in Northeast Pennsylvania',
            shortTitle: 'IT & Networking',
            description: 'Reliable home and small-business networking, Wi-Fi, cabling, security, and technical troubleshooting in the Pittston and Wilkes-Barre area.',
            summary: 'Improve slow, unreliable, or hard-to-manage technology with a network designed around how your home or business actually works.',
            highlights: [
                'Ethernet cabling and organized cable runs',
                'Wi-Fi and mesh network setup',
                'Switch, patch panel, and firewall configuration',
                'Workstation and network troubleshooting',
            ],
            idealFor: [
                'Homes with dead zones, slow Wi-Fi, or unreliable devices',
                'Small businesses upgrading aging network equipment',
                'Offices that need clean cabling and dependable connectivity',
            ],
            icon: 'monitor',
        },
        {
            slug: 'custom-pc-builds',
            formValue: 'pc',
            title: 'Custom PC Builds in Northeast Pennsylvania',
            shortTitle: 'Custom PC Builds',
            description: 'Custom gaming PCs, workstations, and home servers planned around your performance needs, space, and budget.',
            summary: 'Get a balanced system without guessing which parts work together or paying for performance you will not use.',
            highlights: [
                'Gaming and streaming systems',
                'Professional workstations',
                'Home servers and storage systems',
                'Quiet, compact, and purpose-built configurations',
            ],
            idealFor: [
                'Gamers who want a tailored build and upgrade path',
                'Professionals who need reliable workstation performance',
                'Home users building storage, media, or server systems',
            ],
            icon: 'cpu',
        },
        {
            slug: 'programming-automation',
            formValue: 'programming',
            title: 'Programming & Business Automation',
            shortTitle: 'Programming & Automation',
            description: 'Custom scripts, lightweight web applications, and workflow automation for small businesses in Northeast Pennsylvania.',
            summary: 'Replace repetitive manual steps with practical software built around the way your team already works.',
            highlights: [
                'Small-business workflow tools',
                'Data processing and reporting scripts',
                'Task and process automation',
                'Custom web applications',
            ],
            idealFor: [
                'Teams repeatedly copying data between systems',
                'Businesses outgrowing spreadsheets and manual tracking',
                'Owners who need a focused internal tool without enterprise overhead',
            ],
            icon: 'code',
        },
    ],
    testimonials: [
        {
            name: 'Alpha Medicor',
            service: 'Network Infrastructure',
            quote:
                'Our clinic was plagued by horrible network speeds and chronically lagging workstations that disrupted patient charting. Cameron diagnosed the failing infrastructure, upgraded our network from the ground up — new cabling, switches, and access points — and eliminated the latency issues completely. Charting is now instant across every exam room.',
        },
        {
            name: 'Alpha Medicor',
            service: 'Workstation Optimization',
            quote:
                'The computer lagging had gotten so bad our staff was double-documenting because the first entry never registered. Cameron rebuilt the workstations, replaced the failing hardware, and tuned the configurations. Every terminal in the office now runs without a single stall.',
        },
        {
            name: 'Donna Ricker',
            service: 'Landscaping Restoration',
            quote:
                "Our mulched beds had been buried under 20 years of pine needles and overgrowth — we'd long given up on them. Cameron restored the entire landscaping, and in the process uncovered a set of steps we had completely forgotten we ever built. I was blown away by how great it looked when he was finished.",
        },
    ],
};
