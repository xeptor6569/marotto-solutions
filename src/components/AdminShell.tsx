'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes';
import {
    Activity,
    Archive,
    Bookmark,
    Briefcase,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    FileText,
    Gauge,
    Handshake,
    HardHat,
    LifeBuoy,
    ListChecks,
    LogOut,
    MoreHorizontal,
    Plus,
    ReceiptText,
    Repeat,
    Settings,
    Upload,
    UserRound,
    Users,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { signOutFromAdmin } from '@/app/actions';
import CreateMenu from '@/components/CreateMenu';
import ThemeToggle, { AppearanceRadioItems, useAppearancePreference } from '@/components/ThemeToggle';
import {
    ADMIN_NAV_SECTIONS,
    ADMIN_PINNED_TOOL_HREFS,
    ADMIN_TOOL_ITEMS,
    activeNavItem,
    adminBreadcrumbs,
    adminParentHref,
    isActiveNavPath,
    type AdminNavEntry,
} from '@/lib/admin-nav';
import { businessInitials } from '@/lib/branding-core';

const NAV_ICONS: Record<string, LucideIcon> = {
    '/admin': Gauge,
    '/admin/jobs': Briefcase,
    '/admin/clients': Users,
    '/admin/calendar': CalendarDays,
    '/admin/helpers': HardHat,
    '/admin/estimates': ListChecks,
    '/admin/quotes': Handshake,
    '/admin/invoices': FileText,
    '/admin/receipts': ReceiptText,
    '/admin/contracts': Repeat,
    '/admin/presets': Bookmark,
    '/admin/import': Upload,
    '/admin/backup': Archive,
    '/admin/system': Activity,
    '/admin/help': LifeBuoy,
    '/admin/settings': Settings,
};

type NavItem = AdminNavEntry & { icon: LucideIcon };

function withIcon(entry: AdminNavEntry): NavItem {
    return { ...entry, icon: NAV_ICONS[entry.href] ?? FileText };
}

const MOBILE_PRIMARY = ['/admin', '/admin/jobs', '/admin/clients', '/admin/invoices'];

const navSections = ADMIN_NAV_SECTIONS.map((section) => ({ ...section, items: section.items.map(withIcon) }));
const toolItems = ADMIN_TOOL_ITEMS.map(withIcon);
const pinnedToolItems = toolItems.filter((item) => ADMIN_PINNED_TOOL_HREFS.includes(item.href));
const extraToolItems = toolItems.filter((item) => !ADMIN_PINNED_TOOL_HREFS.includes(item.href));
const navItems = navSections.flatMap((section) => section.items);
const mobilePrimaryItems = MOBILE_PRIMARY
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
const mobileMoreItems = navItems.filter((item) => !MOBILE_PRIMARY.includes(item.href));

function BrandMark({ businessName, logoUrl, size = 32 }: { businessName: string; logoUrl?: string | null; size?: number }) {
    return (
        <span className="brand-mark" style={{ width: size, height: size }} aria-hidden>
            {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" />
            ) : (
                <span className="brand-mark-initials">{businessInitials(businessName)}</span>
            )}
        </span>
    );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
    const active = isActiveNavPath(pathname, item);
    return (
        <Link
            href={item.href}
            className="admin-nav-link"
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
        >
            <item.icon size={16} aria-hidden />
            <span>{item.label}</span>
        </Link>
    );
}

function AccountMenu({ userEmail, side = 'top' }: { userEmail: string; side?: 'top' | 'bottom' }) {
    const [appearance, setAppearance] = useAppearancePreference();
    const initial = (userEmail.trim()[0] || 'A').toUpperCase();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <button type="button" className="account-trigger" aria-label="Account menu">
                    <span className="account-avatar" aria-hidden>{initial}</span>
                    <span className="account-trigger-text">
                        <Text as="span" size="2" weight="medium" truncate>{userEmail || 'Admin'}</Text>
                        <Text as="span" size="1" color="gray">Administrator</Text>
                    </span>
                    <ChevronsUpDown size={14} className="account-trigger-chevron" aria-hidden />
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" side={side} sideOffset={6} style={{ minWidth: 220 }}>
                {userEmail ? (
                    <>
                        <DropdownMenu.Label>{userEmail}</DropdownMenu.Label>
                        <DropdownMenu.Separator />
                    </>
                ) : null}
                <DropdownMenu.Item asChild>
                    <Link href="/admin/settings?tab=account"><UserRound size={14} /> Account & password</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                    <Link href="/admin/settings?tab=appearance"><Settings size={14} /> Appearance settings</Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Label>Theme on this device</DropdownMenu.Label>
                <AppearanceRadioItems value={appearance} onChange={setAppearance} />
                <DropdownMenu.Separator />
                <form action={signOutFromAdmin}>
                    <DropdownMenu.Item color="red" asChild>
                        <button type="submit" className="menu-button-item">
                            <LogOut size={14} />
                            Sign out
                        </button>
                    </DropdownMenu.Item>
                </form>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    );
}

function MobileMoreMenu({ pathname, userEmail }: { pathname: string; userEmail: string }) {
    const sections = [mobileMoreItems, toolItems];
    const active = sections.some((items) => items.some((item) => isActiveNavPath(pathname, item)));

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                <button
                    type="button"
                    className="admin-tab"
                    data-active={active || undefined}
                    aria-label="More admin navigation"
                >
                    <span className="admin-tab-icon" aria-hidden><MoreHorizontal size={20} /></span>
                    <span className="admin-tab-label">More</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side="top" sideOffset={8} style={{ minWidth: 220 }}>
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
                                    aria-current={isActiveNavPath(pathname, item) ? 'page' : undefined}
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
                        <button type="submit" className="menu-button-item">
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
    const crumbs = adminBreadcrumbs(pathname);
    const parentHref = adminParentHref(pathname);
    const current = crumbs[crumbs.length - 1];
    const sectionLabel = ADMIN_NAV_SECTIONS.find((section) =>
        section.items.some((item) => item === activeNavItem(pathname)),
    )?.label;

    return (
        <div className="admin-shell look-canvas">
            <aside className="admin-shell-sidebar no-print" aria-label="Admin navigation">
                <Link href="/admin" className="sidebar-brand">
                    <BrandMark businessName={businessName} logoUrl={logoUrl} />
                    <span className="sidebar-brand-text">
                        <Text as="span" size="2" weight="bold" truncate>{businessName}</Text>
                        <span className="ui-eyebrow">Back office</span>
                    </span>
                </Link>

                <nav className="sidebar-nav">
                    {navSections.map((section) => (
                        <div key={section.id} className="sidebar-section">
                            {section.label ? <span className="ui-eyebrow sidebar-section-label">{section.label}</span> : null}
                            {section.items.map((item) => (
                                <NavLink key={item.href} item={item} pathname={pathname} />
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-section">
                        <details
                            className="sidebar-tools"
                            open={extraToolItems.some((item) => isActiveNavPath(pathname, item)) || undefined}
                        >
                            <summary className="admin-nav-link">
                                <Wrench size={16} aria-hidden />
                                <span>Tools</span>
                                <ChevronRight size={14} className="sidebar-tools-chevron" aria-hidden />
                            </summary>
                            <div className="sidebar-tools-items">
                                {extraToolItems.map((item) => (
                                    <NavLink key={item.href} item={item} pathname={pathname} />
                                ))}
                            </div>
                        </details>
                        {pinnedToolItems.map((item) => (
                            <NavLink key={item.href} item={item} pathname={pathname} />
                        ))}
                    </div>
                    <AccountMenu userEmail={userEmail} />
                </div>
            </aside>

            <div className="admin-shell-main">
                <header className="admin-shell-topbar no-print">
                    <div className="admin-shell-topbar-inner">
                        <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
                            {parentHref ? (
                                <IconButton asChild variant="ghost" color="gray" size="2" className="topbar-back">
                                    <Link href={parentHref} aria-label="Back"><ChevronLeft size={18} /></Link>
                                </IconButton>
                            ) : (
                                <Link href="/admin" className="topbar-brand" aria-label={businessName}>
                                    <BrandMark businessName={businessName} logoUrl={logoUrl} size={28} />
                                </Link>
                            )}
                            <nav aria-label="Breadcrumb" className="topbar-crumbs">
                                {sectionLabel ? (
                                    <span className="topbar-crumb topbar-crumb--section">
                                        {sectionLabel}
                                        <ChevronRight size={12} aria-hidden />
                                    </span>
                                ) : null}
                                {crumbs.map((crumb, index) => {
                                    const last = index === crumbs.length - 1;
                                    return (
                                        <span key={crumb.href} className="topbar-crumb" data-last={last || undefined}>
                                            {last ? (
                                                <span aria-current="page">{crumb.label}</span>
                                            ) : (
                                                <Link href={crumb.href}>{crumb.label}</Link>
                                            )}
                                            {!last ? <ChevronRight size={12} aria-hidden /> : null}
                                        </span>
                                    );
                                })}
                            </nav>
                            <span className="topbar-title" data-brand={parentHref ? undefined : true} aria-hidden>
                                {parentHref ? current?.label : businessName}
                            </span>
                        </Flex>
                        <Flex align="center" gap="2">
                            <span className="topbar-mobile-only"><ThemeToggle /></span>
                            <span className="topbar-desktop-only">
                                <CreateMenu />
                            </span>
                        </Flex>
                    </div>
                </header>

                <main className="admin-shell-content">
                    {children}
                </main>
            </div>

            <nav className="admin-shell-bottom-nav no-print" aria-label="Admin">
                {mobilePrimaryItems.slice(0, 2).map((item) => {
                    const active = isActiveNavPath(pathname, item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="admin-tab"
                            data-active={active || undefined}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span className="admin-tab-icon" aria-hidden><item.icon size={20} /></span>
                            <span className="admin-tab-label">{item.shortLabel}</span>
                        </Link>
                    );
                })}
                <CreateMenu
                    side="top"
                    trigger={
                        <button type="button" className="admin-tab admin-tab--create" aria-label="Create">
                            <span className="admin-tab-fab" aria-hidden><Plus size={22} /></span>
                            <span className="admin-tab-label">Create</span>
                        </button>
                    }
                />
                {mobilePrimaryItems.slice(2).map((item) => {
                    const active = isActiveNavPath(pathname, item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="admin-tab"
                            data-active={active || undefined}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span className="admin-tab-icon" aria-hidden><item.icon size={20} /></span>
                            <span className="admin-tab-label">{item.shortLabel}</span>
                        </Link>
                    );
                })}
                <MobileMoreMenu pathname={pathname} userEmail={userEmail} />
            </nav>
        </div>
    );
}
