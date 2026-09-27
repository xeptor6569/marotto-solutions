import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Box, Button, Flex, Heading } from '@radix-ui/themes';
import { ExternalLink, Github } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import DocsNav from '@/components/docs/DocsNav';
import { getBranding, getSiteUrl } from '@/lib/branding';
import { DOCS_REPO_URL, docsHref } from '@/lib/docs';
import { getDocsRequestContext } from '@/lib/docs-server';

export default async function DocsLayout({ children }: { children: ReactNode }) {
    const [{ business, branding }, { onDocsHost, base }] = await Promise.all([getBranding(), getDocsRequestContext()]);
    const siteHref = onDocsHost ? getSiteUrl() : '/';

    return (
        <div className="docs-shell">
            <Box className="public-header docs-header no-print">
                <Flex px={{ initial: '4', sm: '5' }} py="3" justify="between" align="center" gap="3">
                    <Link href={docsHref(base)} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                        <Flex align="center" gap="2">
                            {branding.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={branding.logoUrl}
                                    alt=""
                                    style={{ height: 28, width: 'auto', display: 'block', borderRadius: 6 }}
                                />
                            ) : null}
                            <Heading size="4" truncate>{business.name}</Heading>
                            <Badge variant="soft" size="1">Docs</Badge>
                        </Flex>
                    </Link>
                    <Flex gap="3" align="center" flexShrink="0">
                        <ThemeToggle />
                        <Button variant="ghost" size="2" asChild>
                            <a href={DOCS_REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub">
                                <Github size={16} />
                                <Box as="span" display={{ initial: 'none', sm: 'inline' }}>GitHub</Box>
                            </a>
                        </Button>
                        <Box display={{ initial: 'none', sm: 'block' }}>
                            <Button variant="soft" size="2" asChild>
                                <a href={siteHref}>
                                    Website <ExternalLink size={14} />
                                </a>
                            </Button>
                        </Box>
                    </Flex>
                </Flex>
            </Box>

            <div className="docs-body">
                <aside className="docs-sidebar">
                    <DocsNav base={base} />
                </aside>
                <main className="docs-main">{children}</main>
            </div>
        </div>
    );
}
