'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { IconButton, Popover, Text } from '@radix-ui/themes';
import { ArrowRight, CircleHelp } from 'lucide-react';

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 180;

/**
 * Small "?" next to a label that explains it. Opens on hover for mouse users
 * and on tap/click/Enter everywhere else — hover alone would leave phone
 * users (the primary audience) with no way to read it.
 */
export default function HelpTip({
    children,
    title,
    topic,
    label,
}: {
    children: ReactNode;
    title?: string;
    /** In-app manual topic slug (optionally with `#anchor`) for a "Learn more" link. */
    topic?: string;
    /** Accessible name for the trigger; defaults to the title. */
    label?: string;
}) {
    const [open, setOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const schedule = (next: boolean, delay: number) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpen(next), delay);
    };
    const cancel = () => {
        if (timer.current) clearTimeout(timer.current);
    };

    useEffect(() => cancel, []);

    const hoverHandlers = {
        onPointerEnter: (e: React.PointerEvent) => {
            if (e.pointerType === 'mouse') schedule(true, OPEN_DELAY_MS);
        },
        onPointerLeave: (e: React.PointerEvent) => {
            if (e.pointerType === 'mouse') schedule(false, CLOSE_DELAY_MS);
        },
    };

    return (
        <Popover.Root open={open} onOpenChange={(next) => { cancel(); setOpen(next); }}>
            <Popover.Trigger>
                <IconButton
                    type="button"
                    size="1"
                    variant="ghost"
                    color="gray"
                    radius="full"
                    className="help-tip-trigger"
                    aria-label={`More info${label || title ? `: ${label || title}` : ''}`}
                    {...hoverHandlers}
                >
                    <CircleHelp size={14} aria-hidden />
                </IconButton>
            </Popover.Trigger>
            <Popover.Content
                size="1"
                side="top"
                align="center"
                collisionPadding={12}
                style={{ maxWidth: 300 }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                {...hoverHandlers}
            >
                {title ? (
                    <Text as="div" size="2" weight="bold" mb="1">{title}</Text>
                ) : null}
                <Text as="div" size="2" color="gray" style={{ lineHeight: 1.5 }}>{children}</Text>
                {topic ? (
                    <Text as="div" size="1" mt="2">
                        <Link
                            href={`/admin/help/${topic}`}
                            onClick={() => setOpen(false)}
                            style={{ color: 'var(--accent-11)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                            Learn more <ArrowRight size={12} aria-hidden />
                        </Link>
                    </Text>
                ) : null}
            </Popover.Content>
        </Popover.Root>
    );
}

/** Label text with an optional HelpTip beside it. */
export function LabelWithHelp({ children, help, topic }: { children: ReactNode; help?: ReactNode; topic?: string }) {
    if (!help) return <>{children}</>;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {children}
            <HelpTip topic={topic} label={typeof children === 'string' ? children : undefined}>{help}</HelpTip>
        </span>
    );
}
