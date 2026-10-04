'use client';

import Link from 'next/link';
import { Card, Flex, Heading, IconButton, Text, Tooltip } from '@radix-ui/themes';
import {
    AlarmClock,
    CheckCircle2,
    Clock,
    FilePen,
    Link2,
    Mail,
    MessageSquareReply,
    Phone,
    Repeat,
    UserPlus,
} from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import { useToast } from '@/components/ui/Toaster';
import type { AttentionGroup, AttentionItem, AttentionKind } from '@/lib/dashboard';

function KindIcon({ kind }: { kind: AttentionKind }) {
    switch (kind) {
        case 'overdue':
            return <AlarmClock size={16} />;
        case 'due-soon':
            return <Clock size={16} />;
        case 'draft':
            return <FilePen size={16} />;
        case 'awaiting-reply':
            return <MessageSquareReply size={16} />;
        case 'contract-review':
        case 'contract-due':
            return <Repeat size={16} />;
        case 'prospect':
            return <UserPlus size={16} />;
    }
}

function telHref(phone: string): string {
    return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function AttentionRow({ item }: { item: AttentionItem }) {
    const { format: money } = useMoney();
    const toast = useToast();

    const copyLink = async () => {
        if (!item.shareToken) return;
        const url = new URL(`/d/${item.shareToken}`, window.location.origin).toString();
        try {
            await navigator.clipboard.writeText(url);
            toast({ title: 'Client link copied', description: 'Paste it into a text or email.' });
        } catch {
            toast({ title: 'Could not copy the link', description: url, tone: 'error' });
        }
    };

    return (
        <li className="attention-row" data-severity={item.severity}>
            <span className="attention-icon" data-kind={item.kind} aria-hidden>
                <KindIcon kind={item.kind} />
            </span>
            <div className="attention-main">
                <Link href={item.href} className="attention-link">
                    <Text as="div" size="2" weight="medium" truncate>{item.title}</Text>
                </Link>
                {item.subtitle ? <Text as="div" size="1" color="gray" truncate>{item.subtitle}</Text> : null}
            </div>
            <div className="attention-aside">
                {typeof item.amount === 'number' ? (
                    <Text as="div" size="2" weight="medium" className="ui-figure">{money(item.amount)}</Text>
                ) : null}
                {item.meta ? (
                    <Text as="div" size="1" className="attention-meta" data-severity={item.severity}>{item.meta}</Text>
                ) : null}
            </div>
            <div className="attention-actions">
                {item.contact?.phone ? (
                    <Tooltip content={`Call ${item.contact.phone}`}>
                        <IconButton asChild size="1" variant="soft" color="gray">
                            <a href={telHref(item.contact.phone)} aria-label={`Call ${item.contact.phone}`}><Phone size={13} /></a>
                        </IconButton>
                    </Tooltip>
                ) : null}
                {item.contact?.email ? (
                    <Tooltip content={`Email ${item.contact.email}`}>
                        <IconButton asChild size="1" variant="soft" color="gray">
                            <a href={`mailto:${item.contact.email}`} aria-label={`Email ${item.contact.email}`}><Mail size={13} /></a>
                        </IconButton>
                    </Tooltip>
                ) : null}
                {item.shareToken ? (
                    <Tooltip content="Copy client link">
                        <IconButton size="1" variant="soft" color="gray" onClick={copyLink} aria-label="Copy client link">
                            <Link2 size={13} />
                        </IconButton>
                    </Tooltip>
                ) : null}
            </div>
        </li>
    );
}

/** The dashboard's ranked to-do list, grouped by what kind of action it needs. */
export default function AttentionList({
    sections,
    total,
}: {
    sections: { group: AttentionGroup; label: string; items: AttentionItem[] }[];
    total: number;
}) {
    return (
        <Card size="3" className="attention-card">
            <Flex align="center" justify="between" gap="2" mb="2">
                <Heading size="4" as="h2">Needs attention</Heading>
                {total > 0 ? <span className="attention-count ui-figure">{total}</span> : null}
            </Flex>
            {sections.length === 0 ? (
                <Flex direction="column" align="center" gap="2" py="6" className="attention-empty">
                    <span className="attention-empty-icon" aria-hidden><CheckCircle2 size={22} /></span>
                    <Text size="3" weight="medium">All caught up</Text>
                    <Text size="2" color="gray" align="center">Nothing overdue, no drafts waiting, and no quotes to chase.</Text>
                </Flex>
            ) : (
                <Flex direction="column" gap="4">
                    {sections.map((section) => (
                        <section key={section.group} aria-label={section.label}>
                            <Flex align="center" gap="2" mb="1">
                                <span className="ui-eyebrow">{section.label}</span>
                                <span className="attention-section-count ui-figure">{section.items.length}</span>
                            </Flex>
                            <ul className="attention-rows">
                                {section.items.slice(0, 6).map((item) => (
                                    <AttentionRow key={item.id} item={item} />
                                ))}
                            </ul>
                            {section.items.length > 6 ? (
                                <Text size="1" color="gray" mt="1" as="p">+{section.items.length - 6} more</Text>
                            ) : null}
                        </section>
                    ))}
                </Flex>
            )}
        </Card>
    );
}
