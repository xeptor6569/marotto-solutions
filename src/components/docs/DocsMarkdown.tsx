import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { rewriteDocHref, slugifyHeading } from '@/lib/docs';

function textOf(node: ReactNode): string {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (typeof node === 'object' && 'props' in node) {
        return textOf((node as { props: { children?: ReactNode } }).props.children);
    }
    return '';
}

function AnchoredHeading({ level, children }: { level: 2 | 3 | 4; children: ReactNode }) {
    const id = slugifyHeading(textOf(children));
    const Tag = `h${level}` as const;
    return (
        <Tag id={id}>
            <a href={`#${id}`} className="docs-anchor">
                {children}
            </a>
        </Tag>
    );
}

export default function DocsMarkdown({ children, base }: { children: string; base: string }) {
    return (
        <div className="docs-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children: c }) => <AnchoredHeading level={2}>{c}</AnchoredHeading>,
                    h2: ({ children: c }) => <AnchoredHeading level={2}>{c}</AnchoredHeading>,
                    h3: ({ children: c }) => <AnchoredHeading level={3}>{c}</AnchoredHeading>,
                    h4: ({ children: c }) => <AnchoredHeading level={4}>{c}</AnchoredHeading>,
                    a: ({ href, children: c }) => {
                        const target = rewriteDocHref(href || '', base);
                        const external = /^https?:/i.test(target);
                        return (
                            <a href={target} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                                {c}
                            </a>
                        );
                    },
                    table: ({ children: c }) => (
                        <div className="docs-table-wrap">
                            <table>{c}</table>
                        </div>
                    ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}
