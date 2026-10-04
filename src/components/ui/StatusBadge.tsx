import { Badge } from '@radix-ui/themes';
import {
    documentStatusDisplay,
    statusDisplay,
    type StatusDisplay,
} from '@/lib/status-display';
import type { DocumentData } from '@/lib/types';

type Kind = 'job' | 'contract' | 'event' | 'workflow' | 'document';

/** Soft badge with a leading dot; the label/color come from status-display.ts. */
export default function StatusBadge({
    kind,
    status,
    doc,
    display,
    size = '1',
}: {
    kind?: Kind;
    status?: string;
    /** Pass the document to show derived invoice states (overdue, part paid). */
    doc?: Parameters<typeof documentStatusDisplay>[0] & Partial<Pick<DocumentData, 'id'>>;
    display?: StatusDisplay;
    size?: '1' | '2' | '3';
}) {
    const resolved = display
        ?? (doc ? documentStatusDisplay(doc) : statusDisplay(kind ?? 'document', status ?? ''));
    return (
        <Badge color={resolved.color} variant="soft" size={size} radius="full" className="status-badge">
            <span className="status-dot" aria-hidden />
            {resolved.label}
        </Badge>
    );
}
