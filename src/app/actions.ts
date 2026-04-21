'use server';

import { saveAppConfig } from '@/lib/config';
import { AppConfig, DocumentData, LineItem, Customer, DocumentType, PaymentEntry, PaymentKind } from '@/lib/types';
import { checkConnection } from '@/lib/webdav';
import { saveNewDocument, getNextNumber } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function resolveDocumentStatus(type: DocumentType, intent: string | null, fallback: DocumentData['status'] = 'draft'): DocumentData['status'] {
    if (intent === 'draft') return 'draft';
    if (intent === 'sent') return 'sent';
    if (intent === 'paid' && type === 'invoice') return 'paid';
    return fallback;
}

function getPaymentKind(intent: string | null): PaymentKind {
    if (intent === 'down_payment') return 'down_payment';
    if (intent === 'final') return 'final';
    return 'partial';
}

export async function saveSettingsAction(formData: FormData) {
    const url = formData.get('webdavUrl') as string;
    const username = formData.get('webdavUsername') as string;
    const password = formData.get('webdavPassword') as string;

    const configUpdate: Partial<AppConfig> = {
        webdavUrl: url,
        webdavUsername: username,
        webdavPassword: password, // Note: Storing plain text password locally. Ideal? No. Functional for self-hosted? Yes.
    };

    // Verify connection
    const isValid = await checkConnection(configUpdate as AppConfig, password);
    if (!isValid) {
        return { success: false, error: "Failed to connect to WebDAV with these credentials." };
    }

    await saveAppConfig(configUpdate);
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function createInvoiceAction(formData: FormData) {
    const documentId = formData.get('documentId') as string | null;
    const createdAt = (formData.get('createdAt') as string) || new Date().toISOString();
    const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';
    const number = Number(formData.get('number'));
    const date = formData.get('date') as string;
    const dueDate = formData.get('dueDate') as string;
    const notes = (formData.get('notes') as string) || '';
    const type = (formData.get('type') as string) as DocumentType || 'invoice';
    const currentStatus = ((formData.get('currentStatus') as DocumentData['status']) || 'draft');
    const intent = formData.get('intent') as string | null;
    const status = resolveDocumentStatus(type, intent, currentStatus);
    const paymentAmount = Number(formData.get('paymentAmount') || 0);
    const paymentDate = (formData.get('paymentDate') as string) || new Date().toISOString().split('T')[0];
    const paymentMethod = (formData.get('paymentMethod') as string) || '';
    const paymentNotes = (formData.get('paymentNotes') as string) || '';
    const selectedClientId = (formData.get('clientId') as string) || '';

    const customer: Customer = {
        id: crypto.randomUUID(),
        name: formData.get('customerName') as string,
        email: formData.get('customerEmail') as string,
        address: formData.get('customerAddress') as string,
        clientId: selectedClientId || undefined,
    };

    // Parse items from flat form data
    // items[0][description], items[0][quantity]...
    const items: LineItem[] = [];
    let i = 0;
    while (formData.has(`items[${i}][description]`)) {
        items.push({
            id: crypto.randomUUID(),
            description: formData.get(`items[${i}][description]`) as string,
            details: (formData.get(`items[${i}][details]`) as string) || '',
            quantity: Number(formData.get(`items[${i}][quantity]`)),
            unitPrice: Number(formData.get(`items[${i}][unitPrice]`)),
            total: Number(formData.get(`items[${i}][quantity]`)) * Number(formData.get(`items[${i}][unitPrice]`))
        });
        i++;
    }

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const total = subtotal; // Add tax logic if needed

    const prefix =
        type === 'invoice' ? 'INV' :
        type === 'estimate' ? 'EST' :
        type === 'quote' ? 'QTE' :
        'RCT';

    const doc: DocumentData = {
        id: documentId || `${prefix}-${String(number).padStart(4, '0')}`,
        number,
        type,
        date,
        dueDate,
        customer,
        lineItems: items,
        subtotal,
        total,
        notes,
        status,
        tags: [],
        createdAt,
        updatedAt: new Date().toISOString(),
        payments: initialDataPayments(formData),
        paidAmount: Number(formData.get('paidAmount') || 0),
        balanceDue: Number(formData.get('balanceDue') || total),
    };

    if (type === 'invoice' && intent === 'record_payment' && paymentAmount > 0) {
        const paymentEntry: PaymentEntry = {
            id: crypto.randomUUID(),
            amount: paymentAmount,
            date: new Date(paymentDate).toISOString(),
            method: paymentMethod || undefined,
            notes: paymentNotes || undefined,
            kind: getPaymentKind(formData.get('paymentKind') as string | null),
        };
        const existingPayments = doc.payments || [];
        const payments = [...existingPayments, paymentEntry];
        const paidAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
        const balanceDue = Math.max(0, doc.total - paidAmount);
        doc.payments = payments;
        doc.paidAmount = paidAmount;
        doc.balanceDue = balanceDue;
        doc.status = balanceDue <= 0 ? 'paid' : (doc.status === 'draft' ? 'sent' : doc.status);
    } else {
        const paidAmount = doc.paidAmount || 0;
        doc.balanceDue = Math.max(0, doc.total - paidAmount);
    }

    try {
        await saveNewDocument(doc);
        if (type === 'invoice' && intent === 'record_payment' && paymentAmount > 0) {
            const latestPayment = doc.payments?.[doc.payments.length - 1];
            if (latestPayment) {
                const receiptNumber = await getNextNumber('receipt');
                const receiptId = `RCT-${String(receiptNumber).padStart(4, '0')}`;
                const receipt: DocumentData = {
                    id: receiptId,
                    number: receiptNumber,
                    type: 'receipt',
                    date: latestPayment.date,
                    customer: doc.customer,
                    lineItems: [
                        {
                            id: crypto.randomUUID(),
                            description: `Payment received for invoice ${doc.id}`,
                            details: latestPayment.kind === 'down_payment' ? 'Down payment' : latestPayment.kind === 'final' ? 'Final payment' : 'Partial payment',
                            quantity: 1,
                            unitPrice: latestPayment.amount,
                            total: latestPayment.amount,
                        },
                    ],
                    subtotal: latestPayment.amount,
                    total: latestPayment.amount,
                    notes: latestPayment.notes || `Payment method: ${latestPayment.method || 'N/A'}`,
                    status: 'paid',
                    tags: ['payment-receipt', doc.id],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                await saveNewDocument(receipt);
                latestPayment.receiptId = receiptId;
                await saveNewDocument(doc);
            }
        }
    } catch (e: unknown) {
        console.error("Failed to save invoice", e);
        // In a real app we would return error state, but since we are redirecting we throw or handle differently.
        // If we use useActionState in the form, we can return { error: ... }
        // But for this simple form action redirect:
        throw new Error(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    revalidatePath(`/admin/${type}s`);
    revalidatePath(`/${type}s`);
    revalidatePath(`/admin/${type}s/${doc.id}`);
    revalidatePath(`/${type}s/${doc.id}`);
    redirect(redirectTo);
}

function initialDataPayments(formData: FormData): PaymentEntry[] {
    const raw = formData.get('paymentsJson');
    if (!raw || typeof raw !== 'string') return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((payment) => payment && typeof payment === 'object');
    } catch {
        return [];
    }
}

export async function submitQuoteRequest(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const service = formData.get('service') as string;
    const details = formData.get('details') as string;
    const date = formData.get('date') as string;

    const number = await getNextNumber('lead');

    const doc: DocumentData = {
        id: `LEAD-${number.toString().padStart(4, '0')}`,
        number,
        type: 'lead',
        date: new Date().toISOString(),
        customer: {
            id: email, // simple dedupe key for now
            name,
            email,
        },
        lineItems: [], // No line items yet
        subtotal: 0,
        total: 0,
        status: 'draft', // Draft lead
        notes: `Service: ${service}\nRequested Date: ${date}\nDetails: ${details}`,
        tags: ['new-lead'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await saveNewDocument(doc);

    redirect('/?submitted=true');
}
