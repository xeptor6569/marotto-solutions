'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, Box, Button, DropdownMenu, Flex, Separator, Text } from '@radix-ui/themes';
import {
    Briefcase,
    CalendarDays,
    FileText,
    Gauge,
    Handshake,
    Inbox,
    ListChecks,
    LogOut,
    MoreHorizontal,
    Plus,
    ReceiptText,
    Repeat,
    Settings,
    Upload,
    Users,
    Archive,
    Bookmark,
    HardHat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { signOutFromAdmin } from '@/app/actions';
import CreateMenu from '@/components/CreateMenu';

type NavItem = {
    href: string;
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    matchPrefixes?: string[];
};

const desktopNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', shortLabel: 'Home', icon: Gauge },
    { href: '/admin/jobs', label: 'Jobs', shortLabel: 'Jobs', icon: Briefcase },
    { href: '/admin/clients', label: 'Clients', shortLabel: 'Clients', icon: Users },
    { href: '/admin/helpers', label: 'Helpers', shortLabel: 'Help', icon: HardHat },
    { href: '/admin/calendar', label: 'Calendar', shortLabel: 'Cal', icon: CalendarDays },
    { href: '/admin/leads', label: 'Leads', shortLabel: 'Leads', icon: Inbox },
    { href: '/admin/estimates', label: 'Estimates', shortLabel: 'Est', icon: ListChecks },
    { href: '/admin/quotes', label: 'Quotes', shortLabel: 'Quotes', icon: Handshake },
    { href: '/admin/invoices', label: 'Invoices', shortLabel: 'Inv', icon: FileText },
    { href: '/admin/receipts', label: 'Receipts', shortLabel: 'Rcpt', icon: ReceiptText },
    { href: '/admin/contracts', label: 'Contracts', shortLabel: 'Ctr', icon: Repeat },
];

const mobileNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', shortLabel: 'Home', icon: Gauge },
    { href: '/admin/jobs', label: 'Jobs', shortLabel: 'Jobs', icon: Briefcase },
    { href: '/admin/clients', label: 'Clients', shortLabel: 'Clients', icon: Users },
    { href: '/admin/invoices', label: 'Invoices', shortLabel: 'Invoices', icon: FileText },
];

const moreMenuItems: NavItem[] = [
    { href: '/admin/calendar', label: 'Calendar', shortLabel: 'Cal', icon: CalendarDays },
    { href: '/admin/leads', label: 'Leads', shortLabel: 'Leads', icon: Inbox },
    { href: '/admin/helpers', label: 'Helpers', shortLabel: 'Help', icon: HardHat },
    { href: '/admin/estimates', label: 'Estimates', shortLabel: 'Est', icon: ListChecks },
    { href: '/admin/quotes', label: 'Quotes', shortLabel: 'Quotes', icon: Handshake },
    { href: '/admin/contracts', label: 'Contracts', shortLabel: 'Ctr', icon: Repeat },
    { href: '/admin/receipts', label: 'Receipts', shortLabel: 'Rcpt', icon: ReceiptText },
];

const moreToolItems: NavItem[] = [
    { href: '/admin/presets', label: 'Presets', shortLabel: 'Presets', icon: Bookmark },
    { href: '/admin/import', label: 'Import', shortLabel: 'Import', icon: Upload },
    { href: '/admin/backup', label: 'Backup', shortLabel: 'Backup', icon: Archive },
    { href: '/admin/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

function isActivePath(pathname: string, item: NavItem): boolean {
    // The dashboard lives at the root of every admin path, so it only matches exactly.
    if (item.href === '/admin' && !item.matchPrefixes?.length) return pathname === '/admin';
    const prefixes = [item.href, ...(item.matchPrefixes || [])];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function NavSlotIcon({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <span className="admin-shell-nav-icon" aria-hidden>
            <Icon size={18} />
        </span>
    );
}

function MoreMenu({ pathname, userEmail }: { pathname: string; userEmail: string }) {
    const sections = [moreMenuItems, moreToolItems];
    const active = sections.some((items) => items.some((item) => isActivePath(pathname, item)));

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <button
                    type="button"
                    className={`admin-shell-nav-item${active ? ' is-active' : ''}`}
                    aria-label="More admin navigation"
                >
                    <NavSlotIcon icon={MoreHorizontal} />
                    <span>More</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side="top" sideOffset={8}>
                {userEmail ? (
                    <>
                        <DropdownMenu.Label>{userEmail}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                    </>
                ) : null}
                {sections.map((items, index) => (
                    <Fragment key={items[0]?.href ?? index}>
                        {index > 0 ? <DropdownMenu.Separator /> : null}
                        {items.map((item) => (
                            <DropdownMenu.Item key={item.href} asChild>
                                <Link
                                    href={item.href}
                                    aria-current={isActivePath(pathname, item) ? 'page' : undefined}
                                >
                                    <item.icon size={14} aria-hidden />
                                    {item.label}
                                </Link>
                            </DropdownMenu.Item>
                        ))}
                    </Fragment>
                ))}
                <DropdownMenu.Separator />
                <form action={signOutFromAdmin}>
                    <DropdownMenu.Item color="red" asChild>
                        <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LogOut size={14} />
                            Sign out
                        </button>
                    </DropdownMenu.Item>
                </form>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default function AdminShell({
    children,
    userEmail,
    businessName,
    logoUrl,
}: {
    children: React.ReactNode;
    userEmail: string;
    businessName: string;
    logoUrl?: string | null;
}) {
    const pathname = usePathname();
    const activeTitle =
        [...desktopNavItems, ...moreToolItems].find((item) => isActivePath(pathname, item))?.label ?? 'Admin';

    return (
        <Box>
            <Flex style={{ minHeight: '100dvh' }}>
                <Box className="admin-shell-sidebar no-print">
                    <Flex direction="column" height="100%" px="3" py="4" gap="4">
                        <Flex align="center" gap="2">
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoUrl}
                                    alt=""
                                    style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6 }}
                                />
                            ) : null}
                            <Box style={{ minWidth: 0 }}>
                                <Text as="div" size="3" weight="bold" truncate>{businessName}</Text>
                                <Text as="div" size="1" color="gray">Admin</Text>
                            </Box>
                        </Flex>
                        <Separator size="4" />
                        <Flex direction="column" gap="1">
                            {desktopNavItems.map((item) => {
                                const active = isActivePath(pathname, item);
                                return (
                                    <Button
                                        key={item.href}
                                        asChild
                                        size="2"
                                        variant={active ? 'solid' : 'ghost'}
                                        style={{ justifyContent: 'flex-start' }}
                                    >
                                        <Link href={item.href} aria-current={active ? 'page' : undefined}>
                                            <item.icon size={16} />
                                            {item.label}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </Flex>
                        <Box mt="auto">
                            <Flex direction="column" gap="2">
                                <Button asChild size="2" variant="soft" style={{ justifyContent: 'flex-start' }}>
                                    <Link href="/admin/presets"><Bookmark size={16} /> Presets</Link>
                                </Button>
                                <Button asChild size="2" variant="soft" style={{ justifyContent: 'flex-start' }}>
                                    <Link href="/admin/settings"><Settings size={16} /> Settings</Link>
                                </Button>
                                <Button asChild size="2" variant="soft" style={{ justifyContent: 'flex-start' }}>
                                    <Link href="/admin/import"><Upload size={16} /> Import</Link>
                                </Button>
                                <Button asChild size="2" variant="soft" style={{ justifyContent: 'flex-start' }}>
                                    <Link href="/admin/backup"><Archive size={16} /> Backup</Link>
                                </Button>
                                <Separator size="4" />
                                {userEmail ? (
                                    <Badge color="gray" variant="soft" style={{ justifyContent: 'center' }}>
                                        {userEmail}
                                    </Badge>
                                ) : null}
                                <form action={signOutFromAdmin}>
                                    <Button type="submit" size="2" variant="ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
                                        <LogOut size={16} />
                                        Sign out
                                    </Button>
                                </form>
                            </Flex>
                        </Box>
                    </Flex>
                </Box>

                <Flex direction="column" style={{ minWidth: 0, flex: 1 }}>
                    <Box className="admin-shell-topbar no-print">
                        <Flex
                            align="center"
                            justify="between"
                            gap="2"
                            px={{ initial: '3', sm: '5' }}
                            py="2"
                            className="admin-shell-topbar-inner"
                        >
                            <Flex direction="column" gap="0">
                                <Text size="3" weight="bold">{activeTitle}</Text>
                                <Text size="1" color="gray" className="admin-shell-topbar-subtitle">
                                    Fast access across all documents
                                </Text>
                            </Flex>
                            <Flex align="center" gap="2" className="admin-shell-topbar-desktop-only">
                                <CreateMenu />
                                <Button asChild size="2" variant="soft">
                                    <Link href="/admin/settings"><Settings size={14} /> Settings</Link>
                                </Button>
                            </Flex>
                        </Flex>
                    </Box>

                    <Box className="admin-shell-content">
                        {children}
                    </Box>
                </Flex>
            </Flex>

            <Box className="admin-shell-bottom-nav no-print" role="navigation" aria-label="Admin">
                <Flex align="stretch" gap="1">
                    {mobileNavItems.map((item) => {
                        const active = isActivePath(pathname, item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-shell-nav-item${active ? ' is-active' : ''}`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <NavSlotIcon icon={item.icon} />
                                <span>{item.shortLabel}</span>
                            </Link>
                        );
                    })}
                    <CreateMenu
                        side="top"
                        trigger={
                            <button type="button" className="admin-shell-nav-item is-create" aria-label="Create">
                                <span className="admin-shell-nav-icon" aria-hidden>
                                    <Plus size={18} />
                                </span>
                                <span>Create</span>
                            </button>
                        }
                    />
                    <MoreMenu pathname={pathname} userEmail={userEmail} />
                </Flex>
            </Box>

            <style>{`
                :root {
                    --admin-topbar-h: 52px;
                    --admin-bottom-nav-h: calc(64px + env(safe-area-inset-bottom, 0px));
                }
                .admin-shell-sidebar {
                    display: none;
                    width: 250px;
                    border-right: 1px solid var(--gray-6);
                    background: var(--gray-2);
                    position: sticky;
                    top: 0;
                    height: 100dvh;
                    overflow-y: auto;
                }
                .admin-shell-topbar {
                    position: sticky;
                    top: 0;
                    z-index: 40;
                    padding-top: env(safe-area-inset-top, 0px);
                    background: color-mix(in srgb, var(--color-panel-solid) 92%, transparent);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--gray-6);
                }
                .admin-shell-topbar-inner {
                    min-height: var(--admin-topbar-h);
                }
                .admin-shell-topbar-subtitle {
                    display: none;
                }
                .admin-shell-content {
                    padding-bottom: calc(var(--admin-bottom-nav-h) + 16px);
                }
                .admin-shell-bottom-nav {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 50;
                    border-top: 1px solid var(--gray-6);
                    background: color-mix(in srgb, var(--color-panel-solid) 94%, transparent);
                    backdrop-filter: blur(10px);
                    padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
                }
                .admin-shell-nav-item {
                    flex: 1 1 0;
                    min-width: 0;
                    min-height: 52px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    padding: 4px 2px;
                    border: none;
                    border-radius: 10px;
                    background: transparent;
                    color: var(--gray-11);
                    font-family: inherit;
                    font-size: 10px;
                    font-weight: 500;
                    line-height: 1.1;
                    letter-spacing: 0.01em;
                    text-decoration: none;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .admin-shell-nav-item > span:last-child {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .admin-shell-nav-item:active {
                    background: var(--gray-a3);
                }
                .admin-shell-nav-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 26px;
                    border-radius: 999px;
                    transition: background-color 120ms ease, color 120ms ease;
                }
                .admin-shell-nav-item.is-active {
                    color: var(--accent-11);
                }
                .admin-shell-nav-item.is-active .admin-shell-nav-icon {
                    background: var(--accent-a4);
                }
                .admin-shell-nav-item.is-create .admin-shell-nav-icon {
                    background: var(--accent-9);
                    color: var(--accent-contrast);
                }
                .admin-shell-nav-item:focus-visible {
                    outline: 2px solid var(--accent-8);
                    outline-offset: 2px;
                }
                .admin-shell-topbar-desktop-only {
                    display: none !important;
                }
                /* Menu content is portaled, so the current-page cue is styled globally */
                .rt-BaseMenuItem[aria-current='page'] {
                    color: var(--accent-11);
                    font-weight: 600;
                }
                @media (min-width: 960px) {
                    :root {
                        --admin-topbar-h: 64px;
                        --admin-bottom-nav-h: 0px;
                    }
                    .admin-shell-sidebar {
                        display: block;
                    }
                    .admin-shell-bottom-nav {
                        display: none;
                    }
                    .admin-shell-content {
                        padding-bottom: 0;
                    }
                    .admin-shell-topbar-subtitle {
                        display: block;
                    }
                    .admin-shell-topbar-desktop-only {
                        display: inline-flex !important;
                    }
                }
            `}</style>
        </Box>
    );
}
