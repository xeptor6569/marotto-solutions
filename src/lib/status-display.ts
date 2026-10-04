import type { CalendarEventStatus, DocumentData, WorkflowStatus } from './types';
import { workflowStatusColor, workflowStatusLabel } from './workflow-status';

/**
 * One place that decides how every status reads on screen (label + Radix
 * color), so badges agree across lists, the dashboard, and detail pages.
 */

export type StatusColor = 'gray' | 'orange' | 'amber' | 'blue' | 'cyan' | 'green' | 'red' | 'violet';

export interface StatusDisplay {
    label: string;
    color: StatusColor;
}

export type DocumentDisplayStatus = DocumentData['status'] | 'overdue' | 'partial';

/** List filter; "open" (invoices) = issued and unpaid, whether or not overdue. */
export type DocumentStatusFilter = 'all' | 'open' | DocumentDisplayStatus;

const DOCUMENT_STATUS_FILTERS: DocumentStatusFilter[] = ['all', 'open', 'overdue', 'partial', 'draft', 'sent', 'paid', 'void'];

export function parseDocumentStatusFilter(value: string | undefined): DocumentStatusFilter {
    return DOCUMENT_STATUS_FILTERS.includes(value as DocumentStatusFilter) ? (value as DocumentStatusFilter) : 'all';
}

const DOCUMENT_STATUS: Record<DocumentDisplayStatus, StatusDisplay> = {
    draft: { label: 'Draft', color: 'gray' },
    sent: { label: 'Sent', color: 'blue' },
    partial: { label: 'Part paid', color: 'amber' },
    overdue: { label: 'Overdue', color: 'red' },
    paid: { label: 'Paid', color: 'green' },
    void: { label: 'Void', color: 'gray' },
};

const JOB_STATUS: Record<string, StatusDisplay> = {
    active: { label: 'Active', color: 'green' },
    paused: { label: 'Paused', color: 'amber' },
    closed: { label: 'Closed', color: 'gray' },
};

const CONTRACT_STATUS: Record<string, StatusDisplay> = {
    active: { label: 'Active', color: 'green' },
    paused: { label: 'Paused', color: 'amber' },
    ended: { label: 'Ended', color: 'gray' },
    cancelled: { label: 'Cancelled', color: 'red' },
};

const EVENT_STATUS: Record<CalendarEventStatus, StatusDisplay> = {
    scheduled: { label: 'Scheduled', color: 'orange' },
    confirmed: { label: 'Confirmed', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'red' },
};

function titleCase(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : '—';
}

function lookup(map: Record<string, StatusDisplay>, status: string): StatusDisplay {
    return map[status] ?? { label: titleCase(status), color: 'gray' };
}

/** Outstanding balance on an open invoice (0 once paid or void). */
export function documentBalance(doc: Pick<DocumentData, 'status' | 'total' | 'balanceDue'>): number {
    if (doc.status === 'paid' || doc.status === 'void') return 0;
    const balance = typeof doc.balanceDue === 'number' ? doc.balanceDue : doc.total;
    return Math.max(0, balance);
}

export function isInvoiceOverdue(
    doc: Pick<DocumentData, 'type' | 'status' | 'dueDate' | 'total' | 'balanceDue'>,
    now: Date = new Date(),
): boolean {
    if (doc.type !== 'invoice' || doc.status === 'draft') return false;
    if (!doc.dueDate || documentBalance(doc) <= 0) return false;
    return new Date(doc.dueDate).getTime() < now.getTime();
}

/**
 * The status a document should show: invoices surface derived states
 * (overdue, part paid) that the stored status alone does not capture.
 */
export function documentDisplayStatus(
    doc: Pick<DocumentData, 'type' | 'status' | 'dueDate' | 'total' | 'balanceDue' | 'paidAmount'>,
    now: Date = new Date(),
): DocumentDisplayStatus {
    if (doc.type !== 'invoice') return doc.status;
    if (isInvoiceOverdue(doc, now)) return 'overdue';
    if (doc.status === 'sent' && (doc.paidAmount ?? 0) > 0 && documentBalance(doc) > 0) return 'partial';
    return doc.status;
}

export function statusDisplay(
    kind: 'document' | 'job' | 'contract' | 'event' | 'workflow',
    status: string,
): StatusDisplay {
    switch (kind) {
        case 'document':
            return lookup(DOCUMENT_STATUS, status);
        case 'job':
            return lookup(JOB_STATUS, status);
        case 'contract':
            return lookup(CONTRACT_STATUS, status);
        case 'event':
            return lookup(EVENT_STATUS, status);
        case 'workflow':
            return {
                label: workflowStatusLabel(status as WorkflowStatus),
                color: workflowStatusColor(status as WorkflowStatus) as StatusColor,
            };
    }
}

export function documentStatusDisplay(
    doc: Parameters<typeof documentDisplayStatus>[0],
    now: Date = new Date(),
): StatusDisplay {
    return DOCUMENT_STATUS[documentDisplayStatus(doc, now)];
}
