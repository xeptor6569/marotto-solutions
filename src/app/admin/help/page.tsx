import Link from 'next/link';
import { Box, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { HELP_TOPICS } from '@/lib/help-content';
import { getHelpIcon } from './help-icons';

export const metadata = { title: 'Help' };

export default function HelpIndexPage() {
    return (
        <Container size="3" p={{ initial: '3', sm: '5' }}>
            <Flex direction="column" gap="1" mb="5">
                <Heading size="7">Help & Manual</Heading>
                <Text size="2" color="gray">
                    How everything works — from your first invoice to backups and integrations.
                </Text>
            </Flex>

            <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                {HELP_TOPICS.map((topic) => {
                    const Icon = getHelpIcon(topic.icon);
                    return (
                        <Link
                            key={topic.slug}
                            href={`/admin/help/${topic.slug}`}
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                            <Card className="admin-stat-card" style={{ height: '100%', cursor: 'pointer' }}>
                                <Flex gap="3" align="start">
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: 'var(--accent-3)',
                                            color: 'var(--accent-9)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon size={18} />
                                    </Flex>
                                    <Box style={{ minWidth: 0, flex: 1 }}>
                                        <Text size="2" weight="bold" as="div">{topic.title}</Text>
                                        <Text size="1" color="gray" as="div">{topic.description}</Text>
                                    </Box>
                                    <ChevronRight size={16} style={{ color: 'var(--gray-8)', flexShrink: 0, alignSelf: 'center' }} />
                                </Flex>
                            </Card>
                        </Link>
                    );
                })}
            </Grid>

            <style>{`
                .admin-stat-card {
                    transition: box-shadow 0.15s ease, border-color 0.15s ease;
                }
                @media (hover: hover) {
                    a:hover .admin-stat-card {
                        box-shadow: 0 4px 16px var(--gray-a4);
                        border-color: var(--gray-8);
                    }
                }
            `}</style>
        </Container>
    );
}
