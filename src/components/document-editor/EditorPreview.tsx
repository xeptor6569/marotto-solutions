'use client';

import { useEffect, useRef, useState } from 'react';
import { Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { EyeOff } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import DocumentPaper from '@/components/document/DocumentPaper';
import type { DocumentPaperContext } from '@/lib/document-paper';
import type { DocumentData } from '@/lib/types';

/** Width the paper is laid out at before being scaled to fit the column. */
const PAPER_WIDTH = 720;

/** The printable document rendered from unsaved form state. */
export default function EditorPreview({
    doc,
    context,
    linkedJobName,
    onHide,
}: {
    doc: DocumentData;
    context: DocumentPaperContext;
    linkedJobName?: string | null;
    onHide?: () => void;
}) {
    const { format: money } = useMoney();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);

    // Shrink the paper to the available width, like a print preview, instead of cropping it.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const available = entry.contentRect.width;
            setZoom(Math.min(1, Math.max(0.4, available / PAPER_WIDTH)));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="editor-preview">
            <Flex align="center" justify="between" gap="2" className="editor-preview-bar">
                <Flex align="center" gap="2">
                    <span className="editor-preview-dot" aria-hidden />
                    <Text size="1" weight="medium" color="gray">Live preview — what the client will see</Text>
                </Flex>
                {onHide ? (
                    <Tooltip content="Hide preview">
                        <IconButton type="button" size="1" variant="ghost" color="gray" onClick={onHide} aria-label="Hide preview">
                            <EyeOff size={14} />
                        </IconButton>
                    </Tooltip>
                ) : null}
            </Flex>
            <div className="editor-preview-scroll" ref={scrollRef}>
                <div className="editor-preview-paper" style={{ width: PAPER_WIDTH, zoom }}>
                    <DocumentPaper doc={doc} context={context} money={money} preview linkedJobName={linkedJobName} />
                </div>
            </div>
        </div>
    );
}
