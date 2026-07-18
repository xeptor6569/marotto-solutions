import { describe, expect, it } from 'vitest';
import { applyMarkdownWrap, markdownToSafeHtml } from '@/lib/markdown';

describe('markdownToSafeHtml', () => {
    it('passes plain text as a paragraph', () => {
        expect(markdownToSafeHtml('Hello world')).toBe('<p>Hello world</p>');
    });

    it('renders bold and italic', () => {
        const html = markdownToSafeHtml('**bold** and *italic*');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
    });

    it('renders unordered lists', () => {
        const html = markdownToSafeHtml('- one\n- two');
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>one</li>');
        expect(html).toContain('<li>two</li>');
    });

    it('escapes raw HTML', () => {
        const html = markdownToSafeHtml('<script>alert(1)</script>');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });

    it('renders safe links', () => {
        const html = markdownToSafeHtml('[Docs](https://example.com)');
        expect(html).toContain('<a href="https://example.com">Docs</a>');
    });
});

describe('applyMarkdownWrap', () => {
    it('wraps selection in bold', () => {
        const result = applyMarkdownWrap('hello world', 0, 5, 'bold');
        expect(result.value).toBe('**hello** world');
        expect(result.selectionStart).toBe(2);
        expect(result.selectionEnd).toBe(7);
    });

    it('prefixes list items', () => {
        const result = applyMarkdownWrap('one\ntwo', 0, 7, 'ul');
        expect(result.value).toBe('- one\n- two');
    });
});
