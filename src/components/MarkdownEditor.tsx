'use client';

import { useRef } from 'react';
import { Box, Button, Flex, Text, TextArea } from '@radix-ui/themes';
import { Bold, Italic, Link2, List, ListOrdered } from 'lucide-react';
import { applyMarkdownWrap, type WrapKind } from '@/lib/markdown';

export default function MarkdownEditor({
    name,
    value,
    onChange,
    defaultValue,
    placeholder,
    rows = 4,
    label,
    hint = 'Markdown supported',
}: {
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    defaultValue?: string;
    placeholder?: string;
    rows?: number;
    label?: string;
    hint?: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isControlled = value !== undefined;

    const apply = (kind: WrapKind) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const current = isControlled ? (value ?? '') : el.value;
        const next = applyMarkdownWrap(current, start, end, kind);
        if (isControlled) {
            onChange?.(next.value);
        } else {
            el.value = next.value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(next.selectionStart, next.selectionEnd);
        });
    };

    return (
        <Box>
            {(label || hint) ? (
                <Flex justify="between" align="baseline" gap="2" mb="1" wrap="wrap">
                    {label ? <Text as="label" size="2">{label}</Text> : <span />}
                    {hint ? <Text size="1" color="gray">{hint}</Text> : null}
                </Flex>
            ) : null}
            <Flex gap="1" mb="2" wrap="wrap" className="markdown-editor-toolbar no-print">
                <Button type="button" size="1" variant="soft" onClick={() => apply('bold')} aria-label="Bold">
                    <Bold size={14} />
                </Button>
                <Button type="button" size="1" variant="soft" onClick={() => apply('italic')} aria-label="Italic">
                    <Italic size={14} />
                </Button>
                <Button type="button" size="1" variant="soft" onClick={() => apply('ul')} aria-label="Bullet list">
                    <List size={14} />
                </Button>
                <Button type="button" size="1" variant="soft" onClick={() => apply('ol')} aria-label="Numbered list">
                    <ListOrdered size={14} />
                </Button>
                <Button type="button" size="1" variant="soft" onClick={() => apply('link')} aria-label="Link">
                    <Link2 size={14} />
                </Button>
            </Flex>
            <TextArea
                ref={textareaRef}
                name={name}
                placeholder={placeholder}
                rows={rows}
                value={isControlled ? value : undefined}
                defaultValue={isControlled ? undefined : defaultValue}
                onChange={isControlled ? (e) => onChange?.(e.target.value) : undefined}
                style={{ fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontSize: 13 }}
            />
        </Box>
    );
}
