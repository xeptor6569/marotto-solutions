import type { DocumentData, DocumentType, LineItem } from '@/lib/types';
import { DOC_LABEL } from '@/lib/document-labels';

/**
 * Allowed "create from existing" conversions between document types.
 * Estimates can become quotes or invoices; quotes can become invoices.
 */
export const ALLOWED_CONVERSIONS: Partial<Record<DocumentType, DocumentType[]>> = {
    estimate: ['quote', 'invoice'],
    quote: ['invoice'],
};

const PREFIX: Record<DocumentType, string> = {
    invoice: 'INV',
    estimate: 'EST',
    quote: 'QTE',
    receipt: 'RCT',
    lead: 'LEAD',
};

export function convertTargets(from: DocumentType): DocumentType[] {
    return ALLOWED_CONVERSIONS[from] ?? [];
}

export function canConvert(from: DocumentType, to: DocumentType): boolean {
    return convertTargets(from).includes(to);
}

/**
 * Build a fresh draft document of `targetType` based on an existing source
 * document. Copies the customer, job, line items, and notes. When converting
 * to an invoice every line is billed (the `pendingClientApproval` flag is
 * dropped); when converting to a quote the flag is preserved.
 */
export function buildConvertedDocument(
    source: DocumentData,
    targetType: DocumentType,
    newNumber: number,
): DocumentData {
    if (!canConvert(source.type, targetType)) {
        throw new Error(
            `Cannot convert a ${DOC_LABEL[source.type]} to a ${DOC_LABEL[targetType]}.`,
        );
    }

    const now = new Date().toISOString();
    const id = `${PREFIX[targetType]}-${String(newNumber).padStart(4, '0')}`;

    const lineItems: LineItem[] = source.lineItems.map((item) => {
        const copy: LineItem = { ...item, id: crypto.randomUUID() };
        if (targetType === 'invoice') {
            delete copy.pendingClientApproval;
        }
        return copy;
    });

    const subtotal = Math.round(lineItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0) * 100) / 100;
    const total = subtotal;

    const sourceLabel = DOC_LABEL[source.type];
    const sourceRef = `Created from ${sourceLabel} ${source.id}.`;
    const notes = source.notes ? `${source.notes}\n\n${sourceRef}` : sourceRef;

    const doc: DocumentData = {
        id,
        number: newNumber,
        type: targetType,
        title: source.title,
        date: now.split('T')[0],
        dueDate: source.dueDate,
        customer: { ...source.customer },
        jobId: source.jobId || source.customer.jobId,
        lineItems,
        subtotal,
        total,
        notes,
        status: 'draft',
        tags: ['converted', `source:${source.id}`],
        createdAt: now,
        updatedAt: now,
    };

    if (targetType === 'invoice') {
        doc.payments = [];
        doc.paidAmount = 0;
        doc.balanceDue = total;
    }

    return doc;
}
