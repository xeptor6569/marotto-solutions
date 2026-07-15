'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge, Box, Button, DropdownMenu, Flex, IconButton, Separator, Text } from '@radix-ui/themes';
import {
    Briefcase,
    FileText,
    Gauge,
    Handshake,
    ListChecks,
    LogOut,
    MoreHorizontal,
    ReceiptText,
    Repeat,
    Settings,
    Upload,
    Users,
    Archive,
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
    { href: '/admin/invoices', label: 'Invoices', shortLabel: 'Inv', icon: FileText },
];

function isActivePath(pathname: string, item: NavItem): boolean {
    const prefixes = [item.href, ...(item.matchPrefixes || [])];
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function MoreMenu() {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <IconButton variant="soft" size="2" aria-label="More admin navigation">
                    <MoreHorizontal size={16} />
                </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
                <DropdownMenu.Item asChild>
                    <Link href="/admin/calendar">Calendar</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/estimates">Estimates</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/quotes">Quotes</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/contracts">Contracts</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/receipts">Receipts</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item asChild>
                    <Link href="/admin/import">
                        <Upload size={14} />
                        Import
                    </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/backup">
                        <Archive size={14} />
                        Backup
                    </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/settings">
                        <Settings size={14} />
                        Settings
                    </Link>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

export default function AdminShell({
    children,
    userEmail,
}: {
    children: React.ReactNode;
    userEmail: string;
}) {
    const pathname = usePathname();

    return (
        <Box>
            <Flex style={{ minHeight: '100dvh' }}>
                <Box className="admin-shell-sidebar no-print">
                    <Flex direction="column" height="100%" px="3" py="4" gap="4">
                        <Box>
                            <Text as="div" size="3" weight="bold">Marotto Solutions</Text>
                            <Text as="div" size="1" color="gray">Admin</Text>
                        </Box>
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
                                        <Link href={item.href}>
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
                        <Flex align="center" justify="between" gap="2" px={{ initial: '3', sm: '5' }} py="3">
                            <Flex direction="column" gap="0">
                                <Text size="3" weight="bold">Admin</Text>
                                <Text size="1" color="gray">Fast access across all documents</Text>
                            </Flex>
                            <Flex align="center" gap="2">
                                <CreateMenu />
                                <Button asChild size="2" variant="soft" className="admin-shell-topbar-desktop-only">
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

            <Box className="admin-shell-bottom-nav no-print">
                <Flex align="center" justify="between" gap="1">
                    {mobileNavItems.map((item) => {
                        const active = isActivePath(pathname, item);
                        return (
                            <Button
                                key={item.href}
                                asChild
                                size="1"
                                variant={active ? 'solid' : 'ghost'}
                                style={{ minWidth: 0, flex: 1, justifyContent: 'center' }}
                            >
                                <Link href={item.href}>
                                    <item.icon size={15} />
                                    {item.shortLabel}
                                </Link>
                            </Button>
                        );
                    })}
                    <Flex align="center" gap="1">
                        <CreateMenu />
                        <MoreMenu />
                    </Flex>
                </Flex>
            </Box>

            <style>{`
                .admin-shell-sidebar {
                    display: none;
                    width: 250px;
                    border-right: 1px solid var(--gray-6);
                    background: var(--gray-2);
                    position: sticky;
                    top: 0;
                    height: 100dvh;
                }
                .admin-shell-topbar {
                    position: sticky;
                    top: 0;
                    z-index: 40;
                    background: color-mix(in srgb, var(--color-panel-solid) 92%, transparent);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--gray-6);
                }
                .admin-shell-content {
                    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
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
                    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
                }
                .admin-shell-topbar-desktop-only {
                    display: none !important;
                }
                @media (min-width: 960px) {
                    .admin-shell-sidebar {
                        display: block;
                    }
                    .admin-shell-bottom-nav {
                        display: none;
                    }
                    .admin-shell-content {
                        padding-bottom: 0;
                    }
                    .admin-shell-topbar-desktop-only {
                        display: inline-flex !important;
                    }
                }
            `}</style>
        </Box>
    );
}
