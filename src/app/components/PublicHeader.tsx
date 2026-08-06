import Link from 'next/link';
import { Box, Button, Flex, Heading } from '@radix-ui/themes';
import { Phone } from 'lucide-react';
import type { ResolvedBranding, ResolvedBusiness } from '@/lib/branding';

export default function PublicHeader({
    business,
    branding,
    quoteHref = '/#quote',
    showQuoteButton = true,
}: {
    business: ResolvedBusiness;
    branding: ResolvedBranding;
    quoteHref?: string;
    showQuoteButton?: boolean;
}) {
    return (
        <Box className="public-header no-print">
            <Flex px={{ initial: '4', sm: '5' }} py="3" justify="between" align="center" gap="3">
                <Link href="/" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                    <Flex align="center" gap="2">
                        {branding.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={branding.logoUrl}
                                alt=""
                                style={{ height: 30, width: 'auto', display: 'block', borderRadius: 6 }}
                            />
                        ) : null}
                        <Heading size="5" truncate>{business.name}</Heading>
                    </Flex>
                </Link>
                <Flex gap="3" align="center" flexShrink="0">
                    {business.phoneHref ? (
                        <Button variant="ghost" size="2" asChild>
                            <a href={business.phoneHref} aria-label={`Call ${business.name} at ${business.phoneDisplay}`}>
                                <Phone size={14} /> Call
                            </a>
                        </Button>
                    ) : null}
                    {showQuoteButton ? (
                        <Box display={{ initial: 'none', sm: 'block' }}>
                            <Button size="2" asChild>
                                <Link href={quoteHref}>Get a Quote</Link>
                            </Button>
                        </Box>
                    ) : null}
                </Flex>
            </Flex>
        </Box>
    );
}
