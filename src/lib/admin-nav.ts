/**
 * Admin navigation model and breadcrumb derivation. Kept free of React so the
 * route → crumb logic can be unit-tested; AdminShell attaches the icons.
 */

export interface AdminNavEntry {
    href: string;
    label: string;
    shortLabel: string;
    /** Extra route prefixes that should highlight this entry. */
    matchPrefixes?: string[];
}

export interface AdminNavSection {
    id: string;
    label: string | null;
    items: AdminNavEntry[];
}

// Leads routes redirect into Clients, so Clients owns that prefix for
// active-state highlighting and Leads has no nav entry of its own.
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
    {
        id: 'home',
        label: null,
        items: [{ href: '/admin', label: 'Dashboard', shortLabel: 'Home' }],
    },
    {
        id: 'work',
        label: 'Work',
        items: [
            { href: '/admin/jobs', label: 'Jobs', shortLabel: 'Jobs' },
            { href: '/admin/clients', label: 'Clients', shortLabel: 'Clients', matchPrefixes: ['/admin/leads'] },
            { href: '/admin/calendar', label: 'Calendar', shortLabel: 'Calendar' },
            { href: '/admin/helpers', label: 'Helpers', shortLabel: 'Helpers' },
        ],
    },
    {
        id: 'documents',
        label: 'Documents',
        items: [
            { href: '/admin/estimates', label: 'Estimates', shortLabel: 'Estimates' },
            { href: '/admin/quotes', label: 'Quotes', shortLabel: 'Quotes' },
            { href: '/admin/invoices', label: 'Invoices', shortLabel: 'Invoices' },
            { href: '/admin/receipts', label: 'Receipts', shortLabel: 'Receipts' },
            { href: '/admin/contracts', label: 'Contracts', shortLabel: 'Contracts' },
        ],
    },
];

export const ADMIN_TOOL_ITEMS: AdminNavEntry[] = [
    { href: '/admin/presets', label: 'Presets', shortLabel: 'Presets' },
    { href: '/admin/import', label: 'Import', shortLabel: 'Import' },
    { href: '/admin/backup', label: 'Backup & Restore', shortLabel: 'Backup' },
    { href: '/admin/system', label: 'System', shortLabel: 'System' },
    { href: '/admin/help', label: 'Help', shortLabel: 'Help' },
    { href: '/admin/settings', label: 'Settings', shortLabel: 'Settings' },
];

/** Tools shown directly in the sidebar footer; the rest sit in a collapsible group. */
export const ADMIN_PINNED_TOOL_HREFS = ['/admin/help', '/admin/settings'];

export const ALL_ADMIN_NAV_ITEMS: AdminNavEntry[] = [
    ...ADMIN_NAV_SECTIONS.flatMap((section) => section.items),
    ...ADMIN_TOOL_ITEMS,
];

export function isActiveNavPath(pathname: string, item: AdminNavEntry): boolean {
    // The dashboard lives at the root of every admin path, so it only matches exactly.
    if (item.href === '/admin' && !item.matchPrefixes?.length) return pathname === '/admin';
    const prefixes = [item.href, ...(item.matchPrefixes || [])];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function activeNavItem(pathname: string): AdminNavEntry | undefined {
    return ALL_ADMIN_NAV_ITEMS.find((item) => isActiveNavPath(pathname, item));
}

export interface Breadcrumb {
    label: string;
    href: string;
}

const SEGMENT_LABELS: Record<string, string> = {
    new: 'New',
    create: 'New',
    edit: 'Edit',
    board: 'Board',
    api: 'API',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segmentLabel(segment: string): string {
    const decoded = decodeURIComponent(segment);
    if (SEGMENT_LABELS[decoded]) return SEGMENT_LABELS[decoded];
    // Record ids: document numbers read well (INV-0042); opaque uuids do not.
    if (UUID_RE.test(decoded) || decoded.length > 24) return 'Details';
    return decoded;
}

/**
 * Crumbs below the section, e.g. /admin/invoices/INV-0042/edit →
 * [Invoices, INV-0042, Edit]. The first crumb is the nav entry that owns the
 * route; unknown admin routes fall back to a title-cased segment.
 */
export function adminBreadcrumbs(pathname: string): Breadcrumb[] {
    const clean = pathname.replace(/\/+$/, '') || '/admin';
    if (clean === '/admin') return [{ label: 'Dashboard', href: '/admin' }];

    const owner = activeNavItem(clean);
    const segments = clean.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [];
    let consumed = 2;
    if (owner && owner.href !== '/admin') {
        crumbs.push({ label: owner.label, href: owner.href });
        consumed = owner.href.split('/').filter(Boolean).length;
        // Routes owned through matchPrefixes (e.g. /admin/leads) keep their own depth.
        if (!clean.startsWith(owner.href)) consumed = 2;
    } else if (segments[1]) {
        const label = segments[1].charAt(0).toUpperCase() + segments[1].slice(1);
        crumbs.push({ label, href: `/${segments.slice(0, 2).join('/')}` });
    }

    for (let i = consumed; i < segments.length; i += 1) {
        crumbs.push({
            label: segmentLabel(segments[i]),
            href: `/${segments.slice(0, i + 1).join('/')}`,
        });
    }
    return crumbs;
}

/** Where a mobile back button should go: the parent crumb, if any. */
export function adminParentHref(pathname: string): string | null {
    const crumbs = adminBreadcrumbs(pathname);
    return crumbs.length > 1 ? crumbs[crumbs.length - 2].href : null;
}
