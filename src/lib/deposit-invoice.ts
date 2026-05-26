import type { DocumentData, LineItem } from '@/lib/types';
import {
    agreedScopeLineTotal,
    hasPendingApprovalLines,
} from '@/lib/pending-client-approval';
import { DOC_LABEL } from '@/lib/document-labels';

export type DepositMode = 'percent' | 'fixed';

/** Billable total used when computing a deposit from a quote or estimate. */
export function depositBillingBase(doc: DocumentData): number {
    if (doc.type === 'quote' || doc.type === 'estimate') {
        if (hasPendingApprovalLines(doc.lineItems)) {
            return agreedScopeLineTotal(doc.lineItems);
        }
    }
    return doc.total;
}

export function computeDepositAmount(
    baseTotal: number,
    mode: DepositMode,
    value: number,
): number {
    if (!Number.isFinite(baseTotal) || baseTotal <= 0) {
        throw new Error('Source document has no billable total.');
    }
    if (!Number.isFinite(value)) {
        throw new Error('Enter a valid deposit amount.');
    }
    if (mode === 'percent') {
        if (value <= 0 || value > 100) {
            throw new Error('Percent must be between 0 and 100.');
        }
        return Math.round(baseTotal * (value / 100) * 100) / 100;
    }
    if (value <= 0) {
        throw new Error('Deposit amount must be greater than zero.');
    }
    return Math.round(value * 100) / 100;
}

export function formatDepositLabel(mode: DepositMode, value: number): string {
    if (mode === 'percent') {
        const pct = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
        return `${pct}% down payment`;
    }
    return `$${value.toFixed(2)} down payment`;
}

export function buildDepositInvoiceDraft(
    source: DocumentData,
    invoiceNumber: number,
    mode: DepositMode,
    value: number,
): DocumentData {
    if (source.type !== 'quote' && source.type !== 'estimate') {
        throw new Error('Deposit invoices can only be created from a quote or estimate.');
    }

    const baseTotal = depositBillingBase(source);
    const depositAmount = computeDepositAmount(baseTotal, mode, value);
    const balanceAfterDeposit = Math.max(0, Math.round((baseTotal - depositAmount) * 100) / 100);
    const sourceLabel = DOC_LABEL[source.type];
    const depositLabel = formatDepositLabel(mode, value);
    const today = new Date().toISOString().split('T')[0];

    const lineItem: LineItem = {
        id: crypto.randomUUID(),
        description: depositLabel,
        details: `Deposit on ${sourceLabel} ${source.id}${source.title ? ` — ${source.title}` : ''}`,
        quantity: 1,
        unitPrice: depositAmount,
        total: depositAmount,
    };

    const noteLines = [
        `Deposit invoice for ${sourceLabel} ${source.id}.`,
        `Billing base (agreed scope): $${baseTotal.toFixed(2)}.`,
        `This invoice: $${depositAmount.toFixed(2)} (${depositLabel}).`,
        balanceAfterDeposit > 0
            ? `Estimated balance after this deposit: $${balanceAfterDeposit.toFixed(2)}.`
            : 'This deposit covers the full billing base.',
    ];

    const id = `INV-${String(invoiceNumber).padStart(4, '0')}`;

    return {
        id,
        number: invoiceNumber,
        type: 'invoice',
        title: `Deposit — ${source.id}`,
        date: today,
        dueDate: today,
        customer: { ...source.customer },
        jobId: source.jobId || source.customer.jobId,
        lineItems: [lineItem],
        subtotal: depositAmount,
        total: depositAmount,
        notes: noteLines.join('\n'),
        status: 'draft',
        tags: ['deposit', `source:${source.id}`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payments: [],
        paidAmount: 0,
        balanceDue: depositAmount,
    };
}
