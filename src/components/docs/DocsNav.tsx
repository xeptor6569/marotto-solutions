'use client';

import { Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, type LucideIcon } from 'lucide-react';
import { DOC_PAGES, docsHref, manualHref } from '@/lib/docs';
import { HELP_TOPICS, MANUAL_DIR } from '@/lib/help-content';
import { getHelpIcon } from '@/lib/help-icons';
import { getDocIcon } from './doc-icons';

interface NavItem {
    href: string;
    label: string;
    Icon: LucideIcon;
    active: boolean;
}

/** Sidebar on wide screens, a horizontally scrolling pill row on phones. */
export default function DocsNav({ base }: { base: string }) {
    const pathname = usePathname();
    const navRef = useRef<HTMLElement>(null);
    const parts = pathname.replace(/\/+$/, '').split('/');
    const current = parts.pop() || '';
    const inManual = parts.pop() === MANUAL_DIR;
    const onIndex = !inManual && !DOC_PAGES.some((page) => page.slug === current);

    const groups: Array<{ label: string | null; items: NavItem[] }> = [
        {
            label: null,
            items: [{ href: docsHref(base), label: 'Overview', Icon: BookOpen, active: onIndex }],
        },
        {
            label: 'Set up & run',
            items: DOC_PAGES.map((page) => ({
                href: docsHref(base, page.slug),
                label: page.title,
                Icon: getDocIcon(page.icon),
                active: !inManual && page.slug === current,
            })),
        },
        {
            label: 'User manual',
            items: HELP_TOPICS.map((topic) => ({
                href: manualHref(base, topic.slug),
                label: topic.title,
                Icon: getHelpIcon(topic.icon),
                active: inManual && topic.slug === current,
            })),
        },
    ];

    // In the phone layout the nav scrolls sideways; keep the current page's pill visible.
    useEffect(() => {
        const nav = navRef.current;
        const active = nav?.querySelector<HTMLElement>('[data-active]');
        if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
        nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    }, [pathname]);

    return (
        <nav ref={navRef} className="docs-nav" aria-label="Documentation">
            {groups.map((group) => (
                <Fragment key={group.label ?? 'top'}>
                    {group.label ? <div className="docs-nav-group">{group.label}</div> : null}
                    {group.items.map(({ href, label, Icon, active }) => (
                        <Link
                            key={href}
                            href={href}
                            className="docs-nav-link"
                            data-active={active || undefined}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon size={16} aria-hidden />
                            <span>{label}</span>
                        </Link>
                    ))}
                </Fragment>
            ))}
        </nav>
    );
}
