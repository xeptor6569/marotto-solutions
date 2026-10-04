import type { ReactNode } from 'react';
import { Button, Flex, IconButton, Text, Theme } from '@radix-ui/themes';
import { Mail, Phone } from 'lucide-react';
import { businessInitials, type ResolvedBusiness } from '@/lib/branding-core';

/**
 * Frame for client-facing share links: a slim branded header with contact
 * shortcuts and a contact footer. Pinned to light so the printable paper
 * never floats on a dark page.
 */
export default function ClientShell({
    business,
    logoUrl,
    children,
}: {
    business: ResolvedBusiness;
    logoUrl: string | null;
    children: ReactNode;
}) {
    return (
        <Theme appearance="light" className="client-shell look-canvas">
            <header className="client-header no-print">
                <Flex align="center" justify="between" gap="3" className="client-header-inner">
                    <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                        <span className="brand-mark client-brand-mark" aria-hidden>
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="" />
                            ) : (
                                <span className="brand-mark-initials">{businessInitials(business.name)}</span>
                            )}
                        </span>
                        <div style={{ minWidth: 0 }}>
                            <Text as="div" size="3" weight="bold" truncate>{business.name}</Text>
                            {business.tagline ? <Text as="div" size="1" color="gray" truncate>{business.tagline}</Text> : null}
                        </div>
                    </Flex>
                    <Flex gap="2" flexShrink="0">
                        {business.phoneHref ? (
                            <>
                                <Button asChild variant="soft" className="client-contact-wide">
                                    <a href={business.phoneHref}><Phone size={14} /> {business.phoneDisplay || 'Call'}</a>
                                </Button>
                                <IconButton asChild variant="soft" className="client-contact-narrow" aria-label={`Call ${business.name}`}>
                                    <a href={business.phoneHref}><Phone size={16} /></a>
                                </IconButton>
                            </>
                        ) : null}
                        {business.email ? (
                            <IconButton asChild variant="soft" color="gray" aria-label={`Email ${business.name}`}>
                                <a href={`mailto:${business.email}`}><Mail size={16} /></a>
                            </IconButton>
                        ) : null}
                    </Flex>
                </Flex>
            </header>

            <main className="client-main">{children}</main>

            <footer className="client-footer no-print">
                <Text as="p" size="2" weight="medium">Questions about this document?</Text>
                <Text as="p" size="2" color="gray">
                    Contact {business.name}
                    {business.phoneDisplay && business.phoneHref ? <> · <a href={business.phoneHref}>{business.phoneDisplay}</a></> : null}
                    {business.email ? <> · <a href={`mailto:${business.email}`}>{business.email}</a></> : null}
                </Text>
                {business.addressLine1 ? (
                    <Text as="p" size="1" color="gray">
                        {[business.addressLine1, business.addressLine2].filter(Boolean).join(', ')}
                    </Text>
                ) : null}
            </footer>
        </Theme>
    );
}
