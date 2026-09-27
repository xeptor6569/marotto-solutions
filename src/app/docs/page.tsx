import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { getDocIcon } from '@/components/docs/doc-icons';
import { DOC_PAGES, DOCS_REPO_URL, docsHref } from '@/lib/docs';
import { getDocsRequestContext } from '@/lib/docs-server';

export async function generateMetadata(): Promise<Metadata> {
    const { onDocsHost } = await getDocsRequestContext();
    return {
        title: { absolute: 'Documentation' },
        description: 'Install, configure, and run your own self-hosted business back-office.',
        // On a business's own site /docs is for its admins, not search engines.
        robots: onDocsHost ? undefined : { index: false },
    };
}

export default async function DocsIndexPage() {
    const { base } = await getDocsRequestContext();

    return (
        <div className="docs-article">
            <Flex direction="column" gap="3" mb="6">
                <Heading as="h1" size="8">Documentation</Heading>
                <Text as="p" size="4" color="gray" style={{ lineHeight: 1.6, maxWidth: 620 }}>
                    Run your own copy of the back-office: estimates, invoices, payments, clients, jobs, contracts, and a
                    calendar, branded as your business and hosted on your own server.
                </Text>
            </Flex>

            <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="6">
                {DOC_PAGES.map((page, index) => {
                    const Icon = getDocIcon(page.icon);
                    return (
                        <Link key={page.slug} href={docsHref(base, page.slug)} className="docs-card-link">
                            <Card size="2" className="docs-card" data-featured={index === 0 || undefined}>
                                <Flex gap="3" align="start">
                                    <Flex align="center" justify="center" className="docs-card-icon">
                                        <Icon size={18} />
                                    </Flex>
                                    <Box style={{ minWidth: 0, flex: 1 }}>
                                        <Text size="3" weight="bold" as="div" mb="1">{page.title}</Text>
                                        <Text size="2" color="gray" as="div">{page.description}</Text>
                                    </Box>
                                    <ChevronRight size={16} className="docs-card-chevron" />
                                </Flex>
                            </Card>
                        </Link>
                    );
                })}
            </Grid>

            <div className="docs-content">
                <h2>Already running?</h2>
                <p>
                    Day-to-day usage (documents, payments, contracts, calendar, and branding) is covered by the manual
                    built into the app under <strong>Tools → Help</strong>. Integrations and health checks are documented
                    under <strong>Tools → System → API reference</strong>.
                </p>
                <h2>For developers</h2>
                <p>
                    Local development, architecture, and contribution notes live in the{' '}
                    <a href={`${DOCS_REPO_URL}#readme`} target="_blank" rel="noopener noreferrer">repository README</a>.
                </p>
            </div>
        </div>
    );
}
