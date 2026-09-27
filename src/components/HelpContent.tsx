import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Heading, Text } from '@radix-ui/themes';
import { textOf } from '@/components/docs/DocsMarkdown';
import { rewriteHelpHref, slugifyHeading } from '@/lib/docs';

/**
 * Markdown renderer for the in-app manual: proper heading hierarchy and
 * spacing for long-form reading (the shared MarkdownContent is tuned for
 * short notes).
 */
export default function HelpContent({ children }: { children: string }) {
    return (
        <div className="help-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'code', 'h2', 'h3', 'blockquote']}
                unwrapDisallowed
                components={{
                    h2: ({ children: c }) => (
                        <Heading as="h2" id={slugifyHeading(textOf(c))} size="5" mt="5" mb="2" style={{ scrollMarginTop: 72 }}>{c}</Heading>
                    ),
                    h3: ({ children: c }) => (
                        <Heading as="h3" id={slugifyHeading(textOf(c))} size="3" mt="4" mb="1" style={{ scrollMarginTop: 72 }}>{c}</Heading>
                    ),
                    p: ({ children: c }) => (
                        <Text as="p" size="2" mb="3" style={{ lineHeight: 1.65 }}>{c}</Text>
                    ),
                    ul: ({ children: c }) => (
                        <ul style={{ margin: '0 0 1em', paddingLeft: '1.4em' }}>{c}</ul>
                    ),
                    ol: ({ children: c }) => (
                        <ol style={{ margin: '0 0 1em', paddingLeft: '1.4em' }}>{c}</ol>
                    ),
                    li: ({ children: c }) => (
                        <li style={{ marginBottom: 6, fontSize: 'var(--font-size-2)', lineHeight: 1.6 }}>{c}</li>
                    ),
                    a: ({ href, children: c }) => {
                        const target = rewriteHelpHref(href || '');
                        const external = /^https?:/i.test(target);
                        return (
                            <a
                                href={target}
                                style={{ color: 'var(--accent-11)' }}
                                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                                {c}
                            </a>
                        );
                    },
                    code: ({ children: c }) => (
                        <code
                            style={{
                                fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                                fontSize: '0.9em',
                                background: 'var(--gray-a3)',
                                padding: '1px 5px',
                                borderRadius: 4,
                                wordBreak: 'break-word',
                            }}
                        >
                            {c}
                        </code>
                    ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
