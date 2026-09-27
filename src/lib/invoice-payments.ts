import type { DocumentData, PaymentEntry, PaymentKind } from './types';
import { deleteDocument, getNextNumber, saveNewDocument } from './data';
import { validateRecordPayment } from './document-save';
import { getMoneyFormat } from './branding';
import { buildDocumentId } from './document-numbering';
import { getDocumentNumbering } from './document-numbering-server';

export interface RecordInvoicePaymentInput {
    invoice: DocumentData;
    amount: number;
    date?: string;
    method?: string;
    notes?: string;
    kind?: PaymentKind;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
}

export interface RecordInvoicePaymentResult {
    invoice: DocumentData;
    receipt: DocumentData | null;
    payment: PaymentEntry;
    alreadyRecorded: boolean;
}

function paymentKindLabel(kind: PaymentKind): string {
    if (kind === 'down_payment') return 'Down payment';
    if (kind === 'final') return 'Final payment';
    return 'Partial payment';
}

/**
 * Append a payment to an invoice, update paid/balance/status, and auto-create a receipt.
 * Idempotent when `stripeSessionId` matches an existing payment entry.
 */
export async function recordInvoicePayment(
    input: RecordInvoicePaymentInput,
): Promise<RecordInvoicePaymentResult> {
    const invoice: DocumentData = {
        ...input.invoice,
        payments: [...(input.invoice.payments || [])],
    };

    if (input.stripeSessionId) {
        const existing = invoice.payments?.find((p) => p.stripeSessionId === input.stripeSessionId);
        if (existing) {
            return {
                invoice,
                receipt: null,
                payment: existing,
                alreadyRecorded: true,
            };
        }
    }

    const paidSoFar =
        invoice.paidAmount ??
        invoice.payments?.reduce((acc, payment) => acc + payment.amount, 0) ??
        0;
    const balanceDue = invoice.balanceDue ?? Math.max(0, invoice.total - paidSoFar);
    const amount = Math.round(input.amount * 100) / 100;
    const validationError = validateRecordPayment(amount, balanceDue, await getMoneyFormat());
    if (validationError) {
        throw new Error(validationError);
    }

    const kind: PaymentKind = input.kind || (amount >= balanceDue - 0.001 ? 'final' : 'partial');
    const paymentEntry: PaymentEntry = {
        id: crypto.randomUUID(),
        amount,
        date: input.date ? new Date(input.date).toISOString() : new Date().toISOString(),
        method: input.method || undefined,
        notes: input.notes || undefined,
        kind,
        ...(input.stripeSessionId ? { stripeSessionId: input.stripeSessionId } : {}),
        ...(input.stripePaymentIntentId ? { stripePaymentIntentId: input.stripePaymentIntentId } : {}),
    };

    const payments = [...(invoice.payments || []), paymentEntry];
    const paidAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const nextBalance = Math.max(0, invoice.total - paidAmount);
    invoice.payments = payments;
    invoice.paidAmount = paidAmount;
    invoice.balanceDue = nextBalance;
    invoice.status = nextBalance <= 0 ? 'paid' : invoice.status === 'draft' ? 'sent' : invoice.status;
    invoice.updatedAt = new Date().toISOString();

    await saveNewDocument(invoice);

    const receiptNumber = await getNextNumber('receipt');
    const receiptId = buildDocumentId('receipt', receiptNumber, await getDocumentNumbering());
    const receipt: DocumentData = {
        id: receiptId,
        number: receiptNumber,
        type: 'receipt',
        date: paymentEntry.date,
        customer: invoice.customer,
        jobId: invoice.jobId,
        lineItems: [
            {
                id: crypto.randomUUID(),
                description: `Payment received for invoice ${invoice.id}`,
                details: paymentKindLabel(kind),
                quantity: 1,
                unitPrice: amount,
                total: amount,
            },
        ],
        subtotal: amount,
        total: amount,
        notes: paymentEntry.notes || `Payment method: ${paymentEntry.method || 'N/A'}`,
        status: 'paid',
        tags: ['payment-receipt', invoice.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await saveNewDocument(receipt);

    paymentEntry.receiptId = receiptId;
    invoice.updatedAt = new Date().toISOString();
    await saveNewDocument(invoice);

    return {
        invoice,
        receipt,
        payment: paymentEntry,
        alreadyRecorded: false,
    };
}

function recomputeInvoiceMoney(invoice: DocumentData): DocumentData {
    const payments = invoice.payments ?? [];
    const paidAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const balanceDue = Math.max(0, invoice.total - paidAmount);
    return { ...invoice, payments, paidAmount, balanceDue };
}

/**
 * Undo a recorded payment (a mistaken entry). Deletes the receipt that was
 * auto-created for it and recomputes paid/balance; a fully-paid invoice drops
 * back to "sent". Stripe-recorded payments cannot be removed here because the
 * money actually moved — refund in Stripe instead.
 */
export async function removeInvoicePayment(
    invoice: DocumentData,
    paymentId: string,
): Promise<DocumentData> {
    const payment = invoice.payments?.find((p) => p.id === paymentId);
    if (!payment) {
        throw new Error('That payment is no longer on this invoice.');
    }
    if (payment.stripeSessionId) {
        throw new Error('Stripe payments cannot be removed here. Issue a refund from the Stripe dashboard.');
    }

    if (payment.receiptId) {
        await deleteDocument('receipt', payment.receiptId);
    }

    const updated = recomputeInvoiceMoney({
        ...invoice,
        payments: (invoice.payments ?? []).filter((p) => p.id !== paymentId),
    });
    if (updated.status === 'paid' && (updated.balanceDue ?? 0) > 0) {
        updated.status = 'sent';
    }
    updated.updatedAt = new Date().toISOString();
    await saveNewDocument(updated);
    return updated;
}

/** Bookkeeping-only: mark paid without a payment record (write-offs, untracked cash). */
export async function markInvoicePaidWithoutPayment(invoice: DocumentData): Promise<DocumentData> {
    const updated: DocumentData = { ...invoice, status: 'paid', updatedAt: new Date().toISOString() };
    await saveNewDocument(updated);
    return updated;
}

/** Undo a manual "mark paid": status follows the recorded money again. */
export async function reopenInvoice(invoice: DocumentData): Promise<DocumentData> {
    const recomputed = recomputeInvoiceMoney(invoice);
    const updated: DocumentData = {
        ...recomputed,
        status: (recomputed.balanceDue ?? 0) <= 0 && (recomputed.paidAmount ?? 0) > 0 ? 'paid' : 'sent',
        updatedAt: new Date().toISOString(),
    };
    await saveNewDocument(updated);
    return updated;
}
