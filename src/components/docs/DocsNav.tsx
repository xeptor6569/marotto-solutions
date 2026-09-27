'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { DOC_PAGES, docsHref } from '@/lib/docs';
import { getDocIcon } from './doc-icons';

/** Sidebar on wide screens, a horizontally scrolling pill row on phones. */
export default function DocsNav({ base }: { base: string }) {
    const pathname = usePathname();
    const navRef = useRef<HTMLElement>(null);
    const current = pathname.replace(/\/+$/, '').split('/').pop() || '';
    const onIndex = !DOC_PAGES.some((page) => page.slug === current);

    const items = [
        { href: docsHref(base), label: 'Overview', Icon: BookOpen, active: onIndex },
        ...DOC_PAGES.map((page) => ({
            href: docsHref(base, page.slug),
            label: page.title,
            Icon: getDocIcon(page.icon),
            active: page.slug === current,
        })),
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
            {items.map(({ href, label, Icon, active }) => (
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
        </nav>
    );
}
