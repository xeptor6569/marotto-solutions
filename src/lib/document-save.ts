import type { DocumentData, DocumentType } from '@/lib/types';

export type DocumentSaveIntent =
    | 'save'
    | 'save_and_send'
    | 'record_payment'
    | 'mark_paid_without_payment';

export const DOCUMENT_STATUSES: DocumentData['status'][] = ['draft', 'sent', 'paid', 'void'];

export function statusLabel(status: DocumentData['status']): string {
    if (status === 'draft') return 'Draft';
    if (status === 'sent') return 'Sent';
    if (status === 'paid') return 'Paid';
    return 'Void';
}

export function issueActionLabel(type: DocumentType): string {
    if (type === 'invoice') return 'Issue to client';
    if (type === 'estimate') return 'Finalize estimate';
    if (type === 'quote') return 'Issue quote';
    return 'Mark sent';
}

export function parseFormStatus(value: string | null, fallback: DocumentData['status'] = 'draft'): DocumentData['status'] {
    if (value === 'sent' || value === 'paid' || value === 'void' || value === 'draft') return value;
    return fallback;
}

export function resolveDocumentStatus(input: {
    type: DocumentType;
    intent: string | null;
    formStatus: DocumentData['status'];
    balanceDue: number;
    paidAmount: number;
}): DocumentData['status'] {
    const { type, intent, formStatus, balanceDue, paidAmount } = input;

    if (intent === 'save_and_send') return 'sent';
    if (intent === 'mark_paid_without_payment' && type === 'invoice') return 'paid';

    // Fully paid by recorded payments — status follows money, not manual draft/sent.
    if (type === 'invoice' && balanceDue <= 0 && paidAmount > 0) return 'paid';

    return formStatus;
}

export function validateRecordPayment(amount: number, balanceDue: number): string | null {
    if (!Number.isFinite(amount) || amount <= 0) {
        return 'Enter a payment amount greater than zero.';
    }
    if (amount > balanceDue + 0.001) {
        return `Payment cannot exceed the balance due ($${balanceDue.toFixed(2)}).`;
    }
    return null;
}
