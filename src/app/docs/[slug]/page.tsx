import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import DocsMarkdown from '@/components/docs/DocsMarkdown';
import { DOC_PAGES, DOCS_REPO_URL, docsHref, getDocPage } from '@/lib/docs';
import { getDocsRequestContext, readDoc } from '@/lib/docs-server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const page = getDocPage((await params).slug);
    if (!page) return {};
    const { onDocsHost } = await getDocsRequestContext();
    return {
        title: { absolute: `${page.title} · Documentation` },
        description: page.description,
        robots: onDocsHost ? undefined : { index: false },
    };
}

export default async function DocPageRoute({ params }: Props) {
    const page = getDocPage((await params).slug);
    if (!page) notFound();

    const [{ base }, doc] = await Promise.all([getDocsRequestContext(), readDoc(page)]);
    const index = DOC_PAGES.indexOf(page);
    const prev = DOC_PAGES[index - 1];
    const next = DOC_PAGES[index + 1];

    return (
        <div className="docs-page">
            <article className="docs-article">
                <Flex direction="column" gap="2" mb="5">
                    <Heading as="h1" size="8">{doc.title || page.title}</Heading>
                    <Text as="p" size="3" color="gray">{page.description}</Text>
                </Flex>

                <DocsMarkdown base={base}>{doc.body}</DocsMarkdown>

                <nav className="docs-pager" aria-label="More guides">
                    {prev ? (
                        <Link href={docsHref(base, prev.slug)} className="docs-pager-link">
                            <Text size="1" color="gray"><ArrowLeft size={12} /> Previous</Text>
                            <Text size="3" weight="medium">{prev.title}</Text>
                        </Link>
                    ) : <span />}
                    {next ? (
                        <Link href={docsHref(base, next.slug)} className="docs-pager-link" data-next>
                            <Text size="1" color="gray">Next <ArrowRight size={12} /></Text>
                            <Text size="3" weight="medium">{next.title}</Text>
                        </Link>
                    ) : <span />}
                </nav>

                <a
                    className="docs-edit-link"
                    href={`${DOCS_REPO_URL}/edit/main/docs/${page.file}`}
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
