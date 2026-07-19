/**
 * Lightweight markdown helpers for document notes / line details / warranty.
 * Stored as plain strings; existing plain text remains valid markdown.
 */

const ALLOWED_INLINE = /^(strong|em|a|code|br)$/i;
const ALLOWED_BLOCK = /^(p|ul|ol|li|h1|h2|h3|blockquote|pre)$/i;

/** Elements allowed when rendering markdown in the UI. */
export const MARKDOWN_ALLOWED_ELEMENTS = [
    'p',
    'strong',
    'em',
    'ul',
    'ol',
    'li',
    'a',
    'br',
    'code',
    'h1',
    'h2',
    'h3',
    'blockquote',
] as const;

export function isAllowedMarkdownTag(tag: string): boolean {
    return ALLOWED_INLINE.test(tag) || ALLOWED_BLOCK.test(tag);
}

/**
 * Convert a small subset of markdown to HTML for email/PDF contexts.
 * Escapes HTML first, then applies bold/italic/links/lists/paragraphs.
 * Does not execute raw HTML from the source.
 */
export function markdownToSafeHtml(source: string): string {
    const input = (source || '').replace(/\r\n/g, '\n').trim();
    if (!input) return '';

    const escaped = escapeHtml(input);

    // Fenced code blocks → <pre><code>
    const text = escaped.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
        return `\n<pre><code>${code.replace(/^\n/, '').replace(/\n$/, '')}</code></pre>\n`;
    });

    const blocks = text.split(/\n{2,}/);
    const htmlBlocks = blocks.map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<pre>')) return trimmed;

        const lines = trimmed.split('\n');
        const isUl = lines.every((l) => /^[-*]\s+/.test(l.trim()) || l.trim() === '');
        const isOl = lines.every((l) => /^\d+\.\s+/.test(l.trim()) || l.trim() === '');

        if (isUl) {
            const items = lines
                .filter((l) => l.trim())
                .map((l) => `<li>${formatInline(l.trim().replace(/^[-*]\s+/, ''))}</li>`)
                .join('');
            return `<ul>${items}</ul>`;
        }
        if (isOl) {
            const items = lines
                .filter((l) => l.trim())
                .map((l) => `<li>${formatInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>`)
                .join('');
            return `<ol>${items}</ol>`;
        }

        return `<p>${formatInline(lines.join('<br />'))}</p>`;
    });

    return htmlBlocks.filter(Boolean).join('\n');
}

function formatInline(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export type WrapKind = 'bold' | 'italic' | 'ul' | 'ol' | 'link';

/**
 * Apply a markdown wrap around the current textarea selection.
 * Returns the next value and selection range.
 */
export function applyMarkdownWrap(
    value: string,
    selectionStart: number,
    selectionEnd: number,
    kind: WrapKind,
): { value: string; selectionStart: number; selectionEnd: number } {
    const selected = value.slice(selectionStart, selectionEnd);
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    if (kind === 'bold') {
        const inner = selected || 'bold text';
        const next = `${before}**${inner}**${after}`;
        const start = selectionStart + 2;
        return { value: next, selectionStart: start, selectionEnd: start + inner.length };
    }
    if (kind === 'italic') {
        const inner = selected || 'italic text';
        const next = `${before}*${inner}*${after}`;
        const start = selectionStart + 1;
        return { value: next, selectionStart: start, selectionEnd: start + inner.length };
    }
    if (kind === 'link') {
        const label = selected || 'link text';
        const next = `${before}[${label}](https://)${after}`;
        const start = selectionStart + label.length + 3;
        return { value: next, selectionStart: start, selectionEnd: start + 'https://'.length };
    }
    if (kind === 'ul' || kind === 'ol') {
        const block = selected || 'List item';
        const lines = block.split('\n');
        const prefixed = lines
            .map((line, i) => {
                const trimmed = line.trim() || 'List item';
                return kind === 'ul' ? `- ${trimmed}` : `${i + 1}. ${trimmed}`;
            })
            .join('\n');
        const needsLeadingNewline = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
        const next = `${before}${needsLeadingNewline}${prefixed}${after}`;
        const start = before.length + needsLeadingNewline.length;
        return { value: next, selectionStart: start, selectionEnd: start + prefixed.length };
    }
    return { value, selectionStart, selectionEnd };
}
