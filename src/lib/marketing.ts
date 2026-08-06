export const BUSINESS_NAME = 'Marotto Solutions';
export const PHONE_DISPLAY = '(570) 332-9262';
export const PHONE_E164 = '+15703329262';
export const PHONE_HREF = `tel:${PHONE_E164}`;
export const SERVICE_AREA = 'Pittston, Wilkes-Barre, and surrounding Northeast Pennsylvania communities';

export function getSiteUrl(): string {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
    return (configuredUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

export interface MarketingService {
    slug: string;
    formValue: string;
    title: string;
    shortTitle: string;
    description: string;
    summary: string;
    highlights: string[];
    idealFor: string[];
}

export const marketingServices: MarketingService[] = [
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
    },
];

export function getMarketingService(slug: string): MarketingService | undefined {
    return marketingServices.find((service) => service.slug === slug);
}
