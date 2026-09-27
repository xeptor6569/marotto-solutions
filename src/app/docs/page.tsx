import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { getDocIcon } from '@/components/docs/doc-icons';
import { DOC_PAGES, DOCS_REPO_URL, docsHref, manualHref } from '@/lib/docs';
import { HELP_TOPICS } from '@/lib/help-content';
import { getHelpIcon } from '@/lib/help-icons';
import { getDocsRequestContext } from '@/lib/docs-server';

export async function generateMetadata(): Promise<Metadata> {
    const { onDocsHost } = await getDocsRequestContext();
    return {
        title: { absolute: 'Documentation' },
        description: 'Install, configure, and use your own self-hosted business back-office.',
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

            <Heading as="h2" size="5" mb="1" id="set-up-and-run">Set up &amp; run</Heading>
            <Text as="p" size="2" color="gray" mb="3">For whoever installs and looks after the server.</Text>
            <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="6">
                {DOC_PAGES.map((page, index) => (
                    <DocCard
                        key={page.slug}
                        href={docsHref(base, page.slug)}
                        title={page.title}
                        description={page.description}
                        Icon={getDocIcon(page.icon)}
                        featured={index === 0}
                    />
                ))}
            </Grid>

            <Heading as="h2" size="5" mb="1" id="user-manual" style={{ scrollMarginTop: 80 }}>User manual</Heading>
            <Text as="p" size="2" color="gray" mb="3">
                Day-to-day guides for running your business in the app. The same pages are built into the app under{' '}
                <strong>Tools → Help</strong>.
            </Text>
            <Grid columns={{ initial: '1', sm: '2' }} gap="3" mb="6">
                {HELP_TOPICS.map((topic) => (
                    <DocCard
                        key={topic.slug}
                        href={manualHref(base, topic.slug)}
                        title={topic.title}
                        description={topic.description}
                        Icon={getHelpIcon(topic.icon)}
                        featured={topic.slug === 'first-job'}
                    />
                ))}
            </Grid>

            <div className="docs-content">
                <h2>Integrations</h2>
                <p>
                    Health checks, scheduled jobs, Stripe, and backup endpoints are documented in the app under{' '}
                    <strong>Tools → System → API reference</strong>.
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

function DocCard({
    href,
    title,
    description,
    Icon,
    featured,
}: {
    href: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    featured?: boolean;
}) {
    return (
        <Link href={href} className="docs-card-link">
            <Card size="2" className="docs-card" data-featured={featured || undefined}>
                <Flex gap="3" align="start">
                    <Flex align="center" justify="center" className="docs-card-icon">
                        <Icon size={18} />
                    </Flex>
                    <Box style={{ minWidth: 0, flex: 1 }}>
                        <Text size="3" weight="bold" as="div" mb="1">{title}</Text>
                        <Text size="2" color="gray" as="div">{description}</Text>
                    </Box>
                    <ChevronRight size={16} className="docs-card-chevron" />
                </Flex>
            </Card>
        </Link>
    );
}
