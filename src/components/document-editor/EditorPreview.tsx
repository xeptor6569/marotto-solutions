'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { EyeOff } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import DocumentPaper from '@/components/document/DocumentPaper';
import type { DocumentPaperContext } from '@/lib/document-paper';
import type { DocumentData } from '@/lib/types';

/** Width the paper is laid out at before being scaled to fit the column. */
const PAPER_WIDTH = 720;
const MIN_SCALE = 0.4;

/**
 * Fit the letter-sized paper to the preview column.
 * Uses a transform instead of the CSS `zoom` property: WebKit multiplies a
 * unitless line-height by the zoom factor, so on iPhone paragraphs and
 * addresses collapse onto the lines below them.
 */
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
    const paperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [paperHeight, setPaperHeight] = useState(0);

    useLayoutEffect(() => {
        const scroll = scrollRef.current;
        const paper = paperRef.current;
        if (!scroll || !paper) return;

        const measure = () => {
            const style = getComputedStyle(scroll);
            const available = scroll.clientWidth
                - parseFloat(style.paddingLeft)
                - parseFloat(style.paddingRight);
            if (available <= 0) return;
            const fit = available / PAPER_WIDTH;
            const nextScale = Math.min(1, Math.max(MIN_SCALE, fit));
            // offsetHeight ignores transforms, so this stays the pre-scale layout height.
            const nextHeight = paper.offsetHeight;
            setScale((current) => (Math.abs(current - nextScale) < 0.001 ? current : nextScale));
            setPaperHeight((current) => (Math.abs(current - nextHeight) < 1 ? current : nextHeight));
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(scroll);
        observer.observe(paper);
        return () => observer.disconnect();
    }, []);

    const fit = scale < 1 && scale > MIN_SCALE;
    const scaledWidth = fit ? undefined : PAPER_WIDTH * scale;

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
                <div
                    className="editor-preview-scale"
                    style={{
                        width: scaledWidth ?? '100%',
                        height: paperHeight > 0 ? paperHeight * scale : undefined,
                    }}
                >
                    <div
                        ref={paperRef}
                        className="editor-preview-paper"
                        style={{ width: PAPER_WIDTH, transform: `scale(${scale})` }}
                    >
                        <DocumentPaper doc={doc} context={context} money={money} preview linkedJobName={linkedJobName} />
                    </div>
                </div>
            </div>
        </div>
    );
}
