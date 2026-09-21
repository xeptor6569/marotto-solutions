import { createElement } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Box, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import HelpContent from '@/components/HelpContent';
import { getAdjacentTopics, getHelpTopic, HELP_TOPICS } from '@/lib/help-content';
import { getHelpIcon } from '../help-icons';

export function generateStaticParams() {
    return HELP_TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topic = getHelpTopic(slug);
    return topic ? { title: `${topic.title} · Help` } : {};
}

export default async function HelpTopicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const topic = getHelpTopic(slug);
    if (!topic) notFound();

    const { prev, next } = getAdjacentTopics(slug);

    return (
        <Container size="2" p={{ initial: '3', sm: '5' }}>
            <Flex direction="column" gap="4">
                <Button asChild variant="ghost" size="1" color="gray" style={{ alignSelf: 'flex-start' }}>
                    <Link href="/admin/help"><ArrowLeft size={14} /> All help topics</Link>
                </Button>

                <Flex align="center" gap="3">
                    <Flex
                        align="center"
                        justify="center"
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'var(--accent-3)',
                            color: 'var(--accent-9)',
                            flexShrink: 0,
                        }}
                    >
                        {createElement(getHelpIcon(topic.icon), { size: 20 })}
                    </Flex>
                    <Box>
                        <Heading size="7">{topic.title}</Heading>
                        <Text size="2" color="gray">{topic.description}</Text>
                    </Box>
                </Flex>

                <Card size="3">
                    <HelpContent>{topic.body}</HelpContent>
                </Card>

                <Flex justify="between" gap="3" wrap="wrap">
                    {prev ? (
                        <Button asChild variant="soft" color="gray" size="2">
                            <Link href={`/admin/help/${prev.slug}`}>
                                <ChevronLeft size={14} /> {prev.title}
                            </Link>
                        </Button>
                    ) : <Box />}
                    {next ? (
                        <Button asChild variant="soft" size="2">
                            <Link href={`/admin/help/${next.slug}`}>
                                {next.title} <ChevronRight size={14} />
                            </Link>
                        </Button>
                    ) : <Box />}
                </Flex>
            </Flex>
        </Container>
    );
}
