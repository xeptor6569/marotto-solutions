'use client';

import { Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { EyeOff } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import DocumentPaper from '@/components/document/DocumentPaper';
import type { DocumentPaperContext } from '@/lib/document-paper';
import type { DocumentData } from '@/lib/types';

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
            <div className="editor-preview-scroll">
                <div className="editor-preview-paper">
                    <DocumentPaper doc={doc} context={context} money={money} preview linkedJobName={linkedJobName} />
                </div>
            </div>
        </div>
    );
}
