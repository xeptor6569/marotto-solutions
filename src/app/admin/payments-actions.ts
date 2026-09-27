'use server';

import { revalidatePath } from 'next/cache';
import { getDocumentById } from '@/lib/data';
import {
    markInvoicePaidWithoutPayment,
    recordInvoicePayment,
    removeInvoicePayment,
    reopenInvoice,
} from '@/lib/invoice-payments';
import { requireAdminAction } from '@/lib/require-admin-session';
import type { DocumentData, PaymentKind } from '@/lib/types';

export type PaymentActionState = {
    success: boolean;
    error?: string;
    message?: string;
    receiptId?: string | null;
};

function parseKind(raw: unknown): PaymentKind | undefined {
    if (raw === 'down_payment' || raw === 'final' || raw === 'partial') return raw;
    return undefined;
}

async function loadInvoice(invoiceId: string): Promise<{ invoice: DocumentData } | { error: string }> {
    const doc = await getDocumentById(invoiceId.trim());
    if (!doc || doc.type !== 'invoice') return { error: 'Invoice not found.' };
    if (doc.status === 'void') return { error: 'This invoice is void.' };
    return { invoice: doc };
}

function revalidateInvoice(invoice: DocumentData) {
    revalidatePath('/admin');
    revalidatePath('/admin/invoices');
    revalidatePath('/admin/receipts');
    revalidatePath(`/admin/invoices/${invoice.id}`);
    revalidatePath(`/invoices/${invoice.id}`);
    if (invoice.jobId) revalidatePath(`/admin/jobs/${invoice.jobId}`);
    if (invoice.shareToken) revalidatePath(`/d/${invoice.shareToken}`);
}

/** Record a payment against an invoice from the invoice page (no full-form resave). */
export async function recordPaymentAction(
    _prev: PaymentActionState | undefined,
    formData: FormData,
): Promise<PaymentActionState> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const loaded = await loadInvoice((formData.get('invoiceId') as string) || '');
    if ('error' in loaded) return { success: false, error: loaded.error };

    const amount = Number(formData.get('amount'));
    const date = ((formData.get('date') as string) || '').trim();
    const method = ((formData.get('method') as string) || '').trim();
    const notes = ((formData.get('notes') as string) || '').trim();

    try {
        const result = await recordInvoicePayment({
            invoice: loaded.invoice,
            amount,
            date: date || undefined,
            method: method || undefined,
            notes: notes || undefined,
            kind: parseKind(formData.get('kind')),
        });
        revalidateInvoice(result.invoice);
        return {
            success: true,
            receiptId: result.receipt?.id ?? null,
            message: result.invoice.status === 'paid'
                ? 'Payment recorded — invoice is now paid in full.'
                : 'Payment recorded.',
        };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to record payment.' };
    }
}

export async function removePaymentAction(
    _prev: PaymentActionState | undefined,
    formData: FormData,
): Promise<PaymentActionState> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const loaded = await loadInvoice((formData.get('invoiceId') as string) || '');
    if ('error' in loaded) return { success: false, error: loaded.error };

    try {
        const updated = await removeInvoicePayment(loaded.invoice, (formData.get('paymentId') as string) || '');
        revalidateInvoice(updated);
        return { success: true, message: 'Payment removed and its receipt deleted.' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to remove payment.' };
    }
}

export async function markInvoicePaidAction(
    _prev: PaymentActionState | undefined,
    formData: FormData,
): Promise<PaymentActionState> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const loaded = await loadInvoice((formData.get('invoiceId') as string) || '');
    if ('error' in loaded) return { success: false, error: loaded.error };

    try {
        const updated = await markInvoicePaidWithoutPayment(loaded.invoice);
        revalidateInvoice(updated);
        return { success: true, message: 'Invoice marked paid (no payment recorded).' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update invoice.' };
    }
}

export async function reopenInvoiceAction(
    _prev: PaymentActionState | undefined,
    formData: FormData,
): Promise<PaymentActionState> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const loaded = await loadInvoice((formData.get('invoiceId') as string) || '');
    if ('error' in loaded) return { success: false, error: loaded.error };

    try {
        const updated = await reopenInvoice(loaded.invoice);
        revalidateInvoice(updated);
        return { success: true, message: 'Invoice reopened — status now follows recorded payments.' };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to update invoice.' };
    }
}
