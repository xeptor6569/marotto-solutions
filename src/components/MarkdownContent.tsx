import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MARKDOWN_ALLOWED_ELEMENTS } from '@/lib/markdown';

export default function MarkdownContent({
    children,
    className,
    style,
}: {
    children?: string | null;
    className?: string;
    style?: React.CSSProperties;
}) {
    const source = (children || '').trim();
    if (!source) return null;

    return (
        <div className={className ? `markdown-content ${className}` : 'markdown-content'} style={style}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                allowedElements={[...MARKDOWN_ALLOWED_ELEMENTS]}
                unwrapDisallowed
                components={{
                    a: ({ href, children: linkChildren }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {linkChildren}
                        </a>
                    ),
                    p: ({ children: pChildren }) => <p style={{ margin: '0 0 0.65em' }}>{pChildren}</p>,
                    ul: ({ children: ulChildren }) => (
                        <ul style={{ margin: '0 0 0.65em', paddingLeft: '1.25em' }}>{ulChildren}</ul>
                    ),
                    ol: ({ children: olChildren }) => (
                        <ol style={{ margin: '0 0 0.65em', paddingLeft: '1.25em' }}>{olChildren}</ol>
                    ),
                    li: ({ children: liChildren }) => <li style={{ marginBottom: 4 }}>{liChildren}</li>,
                    h1: ({ children: hChildren }) => (
                        <p style={{ margin: '0 0 0.5em', fontWeight: 700, fontSize: '1.1em' }}>{hChildren}</p>
                    ),
                    h2: ({ children: hChildren }) => (
                        <p style={{ margin: '0 0 0.5em', fontWeight: 700, fontSize: '1.05em' }}>{hChildren}</p>
                    ),
                    h3: ({ children: hChildren }) => (
                        <p style={{ margin: '0 0 0.5em', fontWeight: 700 }}>{hChildren}</p>
                    ),
                    code: ({ children: codeChildren }) => (
                        <code
                            style={{
                                fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                                fontSize: '0.9em',
                                background: 'color-mix(in srgb, var(--gray-a3) 80%, transparent)',
                                padding: '0 4px',
                                borderRadius: 4,
                            }}
                        >
                            {codeChildren}
                        </code>
                    ),
                }}
            >
                {source}
            </ReactMarkdown>
            <style>{`
                .markdown-content > :last-child {
                    margin-bottom: 0 !important;
                }
                .markdown-content a {
                    color: var(--accent-11);
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
