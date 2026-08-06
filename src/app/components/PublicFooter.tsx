import Link from 'next/link';
import { Box, Container, Flex, Text } from '@radix-ui/themes';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { ResolvedBusiness } from '@/lib/branding';

export default function PublicFooter({
    business,
    showQuoteLink = true,
}: {
    business: ResolvedBusiness;
    showQuoteLink?: boolean;
}) {
    return (
        <Box py="6" style={{ backgroundColor: 'var(--gray-2)', borderTop: '1px solid var(--gray-4)' }} className="no-print">
            <Container size="3" px="4">
                <Flex direction="column" align="center" gap="3">
                    <Flex gap="5" align="center" wrap="wrap" justify="center">
                        {business.phoneDisplay ? (
                            <Flex gap="2" align="center">
                                <Phone size={14} style={{ color: 'var(--gray-8)' }} />
                                <Text size="2" color="gray">
                                    <a href={business.phoneHref ?? undefined} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {business.phoneDisplay}
                                    </a>
                                </Text>
                            </Flex>
                        ) : null}
                        {business.email ? (
                            <Flex gap="2" align="center">
                                <Mail size={14} style={{ color: 'var(--gray-8)' }} />
                                <Text size="2" color="gray">
                                    <a href={`mailto:${business.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {business.email}
                                    </a>
                                </Text>
                            </Flex>
                        ) : null}
                        {business.serviceArea ? (
                            <Flex gap="2" align="center">
                                <MapPin size={14} style={{ color: 'var(--gray-8)' }} />
                                <Text size="2" color="gray">{business.serviceArea}</Text>
                            </Flex>
                        ) : null}
                        {showQuoteLink ? (
                            <Link href="/#quote" style={{ textDecoration: 'none' }}>
                                <Text size="2" color="gray" style={{ textDecoration: 'underline' }}>Get a Quote</Text>
                            </Link>
                        ) : null}
                    </Flex>
                    <Flex gap="3" align="center" wrap="wrap" justify="center">
                        <Text align="center" color="gray" size="1">
                            &copy; {new Date().getFullYear()} {business.name}. All rights reserved.
                        </Text>
                        <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                            <Text size="1" color="gray" style={{ textDecoration: 'underline' }}>Sign in</Text>
                        </Link>
                    </Flex>
                </Flex>
            </Container>
        </Box>
    );
}
