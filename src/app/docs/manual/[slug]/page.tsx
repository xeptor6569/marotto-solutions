import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import DocsMarkdown from '@/components/docs/DocsMarkdown';
import { DOCS_REPO_URL, manualHref } from '@/lib/docs';
import { getDocsRequestContext, readHelpTopic } from '@/lib/docs-server';
import { getAdjacentTopics, getHelpTopic, helpTopicFile, MANUAL_DIR } from '@/lib/help-content';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const topic = getHelpTopic((await params).slug);
    if (!topic) return {};
    const { onDocsHost } = await getDocsRequestContext();
    return {
        title: { absolute: `${topic.title} · User manual` },
        description: topic.description,
        robots: onDocsHost ? undefined : { index: false },
    };
}

export default async function ManualPageRoute({ params }: Props) {
    const topic = getHelpTopic((await params).slug);
    if (!topic) notFound();

    const [{ base }, doc] = await Promise.all([getDocsRequestContext(), readHelpTopic(topic)]);
    const { prev, next } = getAdjacentTopics(topic.slug);

    return (
        <div className="docs-page">
            <article className="docs-article">
                <Flex direction="column" gap="2" mb="5">
                    <Text size="1" weight="bold" color="gray" style={{ letterSpacing: '0.06em' }}>USER MANUAL</Text>
                    <Heading as="h1" size="8">{doc.title || topic.title}</Heading>
                    <Text as="p" size="3" color="gray">{topic.description}</Text>
                </Flex>

                <DocsMarkdown base={base} fromDir={MANUAL_DIR}>{doc.body}</DocsMarkdown>

                <nav className="docs-pager" aria-label="More manual pages">
                    {prev ? (
                        <Link href={manualHref(base, prev.slug)} className="docs-pager-link">
                            <Text size="1" color="gray"><ArrowLeft size={12} /> Previous</Text>
                            <Text size="3" weight="medium">{prev.title}</Text>
                        </Link>
                    ) : <span />}
                    {next ? (
                        <Link href={manualHref(base, next.slug)} className="docs-pager-link" data-next>
                            <Text size="1" color="gray">Next <ArrowRight size={12} /></Text>
                            <Text size="3" weight="medium">{next.title}</Text>
                        </Link>
                    ) : <span />}
                </nav>

                <a
                    className="docs-edit-link"
                    href={`${DOCS_REPO_URL}/edit/main/docs/${helpTopicFile(topic)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Pencil size={13} /> Suggest an edit on GitHub
                </a>
            </article>

            {doc.headings.length > 1 ? (
                <aside className="docs-toc" aria-label="On this page">
                    <Text size="1" weight="bold" color="gray" as="div" mb="2">ON THIS PAGE</Text>
                    {doc.headings.map((heading) => (
                        <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>
                    ))}
                </aside>
            ) : null}
        </div>
    );
}
