'use server';

import { signOut } from '@/lib/auth';
import { getAppConfig, saveAppConfig } from '@/lib/config';
import { AppConfig, BillingConfig, DocumentData, LineItem, Customer, DocumentType, PaymentEntry, PaymentKind, PaymentMethodKey } from '@/lib/types';
import { checkConnection } from '@/lib/webdav';
import { saveNewDocument, getNextNumber, getDocumentById, deleteDocument } from '@/lib/data';
import { parseLineItemsFromFormData } from '@/lib/parse-line-items';
import {
    buildDepositInvoiceDraft,
    type DepositMode,
} from '@/lib/deposit-invoice';
import { createJob, getJobOptions } from '@/lib/jobs';
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
    const url = ((formData.get('webdavUrl') as string) || '').trim();
    const username = ((formData.get('webdavUsername') as string) || '').trim();
    const password = ((formData.get('webdavPassword') as string) || '').trim();
    const checkPayableTo = ((formData.get('checkPayableTo') as string) || '').trim();
    const paymentInstructions = ((formData.get('paymentInstructions') as string) || '').trim();
    const paymentMethodKeys: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];
    const currentConfig = await getAppConfig();

    const configUpdate: Partial<AppConfig> = {
        webdavUrl: url,
        webdavUsername: username,
        webdavPassword: password, // Note: Storing plain text password locally. Ideal? No. Functional for self-hosted? Yes.
        billing: {
            checkPayableTo,
            paymentInstructions,
            paymentMethods: paymentMethodKeys.reduce((acc, key) => {
                const existing = currentConfig.billing?.paymentMethods?.[key];
                const currentLabel = existing?.label
                    || (key === 'cash' ? 'Cash'
                        : key === 'check' ? 'Check'
                        : key === 'zelle' ? 'Zelle'
                        : key === 'cashApp' ? 'Cash App'
                        : key === 'paypal' ? 'PayPal'
                        : key === 'venmo' ? 'Venmo'
                        : key === 'applePay' ? 'Apple Pay'
                        : 'Stripe');

                acc[key] = {
                    enabled: formData.has(`billing.${key}.enabled`),
                    label: currentLabel,
                    value: ((formData.get(`billing.${key}.value`) as string) || '').trim(),
                    note: ((formData.get(`billing.${key}.note`) as string) || '').trim(),
                    comingSoon: formData.has(`billing.${key}.comingSoon`),
                };
                return acc;
            }, {} as BillingConfig['paymentMethods']),
        },
    };

    const webdavConfigChanged =
        url !== (currentConfig.webdavUrl || '')
        || username !== (currentConfig.webdavUsername || '')
        || password !== (currentConfig.webdavPassword || '');

    if (webdavConfigChanged && url && username) {
        const isValid = await Promise.race([
            checkConnection(configUpdate as AppConfig, password),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
        ]);
        if (!isValid) {
            return { success: false, error: "Failed to connect to WebDAV with these credentials." };
        }
    }

    try {
        await saveAppConfig(configUpdate);
    } catch (error) {
        console.error('Failed to save settings', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to save settings: ${message}` };
    }
    revalidatePath('/admin/settings');
    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function createDepositInvoiceAction(input: {
    sourceDocumentId: string;
    mode: DepositMode;
    value: number;
}): Promise<{ success: false; error: string } | never> {
    const sourceId = input.sourceDocumentId?.trim();
    if (!sourceId) {
        return { success: false, error: 'Source document is required.' };
    }

    try {
        const source = await getDocumentById(sourceId);
        if (!source || (source.type !== 'quote' && source.type !== 'estimate')) {
            return { success: false, error: 'Source quote or estimate not found.' };
        }

        const number = await getNextNumber('invoice');
        const doc = buildDepositInvoiceDraft(source, number, input.mode, input.value);
        await saveNewDocument(doc);

        revalidatePath('/admin');
        revalidatePath('/admin/invoices');
        revalidatePath(`/admin/${source.type}s`);
        revalidatePath(`/admin/${source.type}s/${source.id}`);
        revalidatePath(`/admin/invoices/${doc.id}`);
        revalidatePath(`/admin/invoices/${doc.id}/edit`);

        redirect(`/admin/invoices/${doc.id}/edit`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) {
                throw error;
            }
        }
        console.error('Failed to create deposit invoice', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function createInvoiceAction(formData: FormData) {
    const documentId = formData.get('documentId') as string | null;
    const createdAt = (formData.get('createdAt') as string) || new Date().toISOString();
    const redirectToInput = ((formData.get('redirectTo') as string) || '').trim();
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
    const selectedLeadId = (formData.get('leadId') as string) || '';
    const selectedJobId = (formData.get('jobId') as string) || '';

    const customer: Customer = {
        id: crypto.randomUUID(),
        name: formData.get('customerName') as string,
        email: formData.get('customerEmail') as string,
        address: formData.get('customerAddress') as string,
        phone: ((formData.get('customerPhone') as string) || '').trim() || undefined,
        clientId: selectedClientId || undefined,
        leadId: selectedLeadId || undefined,
        jobId: selectedJobId || undefined,
    };

    if (selectedLeadId) {
        const leadDoc = await getDocumentById(selectedLeadId);
        if (leadDoc?.type === 'lead') {
            customer.leadId = selectedLeadId;
            customer.id = leadDoc.customer.id;
        }
    }

    const items = parseLineItemsFromFormData(formData);
    if (items.length === 0) {
        throw new Error('Add at least one line item before saving.');
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
        jobId: selectedJobId || undefined,
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
                    jobId: doc.jobId,
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
    if (selectedLeadId) {
        revalidatePath('/admin/leads');
    }
    if (selectedJobId) {
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${selectedJobId}`);
    }
    revalidatePath(`/admin/${type}s`);
    revalidatePath(`/${type}s`);
    revalidatePath(`/admin/${type}s/${doc.id}`);
    revalidatePath(`/${type}s/${doc.id}`);

    const redirectTo =
        redirectToInput && !['/admin', '/dashboard'].includes(redirectToInput)
            ? redirectToInput
            : type === 'lead'
                ? `/admin/leads/${doc.id}`
                : `/admin/${type}s/${doc.id}`;

    redirect(redirectTo);
}

export async function createLeadAction(formData: FormData) {
    const name = (formData.get('name') as string)?.trim();
    if (!name) {
        throw new Error('Name is required');
    }
    const email = ((formData.get('email') as string) || '').trim();
    const phone = ((formData.get('phone') as string) || '').trim();
    const address = ((formData.get('address') as string) || '').trim();
    const notes = ((formData.get('notes') as string) || '').trim();
    const selectedJobId = ((formData.get('jobId') as string) || '').trim();
    const rawClientStage = ((formData.get('clientStage') as string) || 'lead').trim();
    const clientStage: 'lead' | 'potential_client' = rawClientStage === 'potential_client' ? 'potential_client' : 'lead';

    const number = await getNextNumber('lead');
    const customerId = email || crypto.randomUUID();

    const doc: DocumentData = {
        id: `LEAD-${String(number).padStart(4, '0')}`,
        number,
        type: 'lead',
        date: new Date().toISOString(),
        customer: {
            id: customerId,
            name,
            email: email || undefined,
            phone: phone || undefined,
            address: address || undefined,
            jobId: selectedJobId || undefined,
            clientStage,
        },
        jobId: selectedJobId || undefined,
        lineItems: [],
        subtotal: 0,
        total: 0,
        status: 'draft',
        notes: notes || undefined,
        tags: ['client', clientStage, 'manual'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await saveNewDocument(doc);
    revalidatePath('/admin');
    revalidatePath('/admin/leads');
    revalidatePath(`/admin/leads/${doc.id}`);
    if (selectedJobId) {
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${selectedJobId}`);
    }
    redirect(`/admin/leads/${doc.id}`);
}

export async function signOutFromAdmin() {
    await signOut({ redirectTo: '/' });
}

export async function createJobAction(input: {
    name: string;
    description?: string;
    status?: string;
    clientId?: string;
    leadId?: string;
}) {
    const name = input.name?.trim();
    if (!name) {
        return { success: false as const, error: 'Job name is required' };
    }
    try {
        const job = await createJob({
            name,
            description: input.description?.trim() || '',
            status: input.status || 'active',
            clientId: input.clientId || '',
            leadId: input.leadId || '',
        });
        revalidatePath('/admin');
        revalidatePath('/admin/jobs');
        return { success: true as const, job };
    } catch (error) {
        console.error('Failed to create job', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false as const, error: `Failed to create job: ${message}` };
    }
}

export async function getJobOptionsForForm(params?: { clientId?: string; leadId?: string }) {
    return getJobOptions(params);
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

export async function updateLeadAction(input: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    clientStage?: 'lead' | 'potential_client';
}): Promise<{ success: boolean; error?: string }> {
    const id = input.id?.trim();
    if (!id) {
        return { success: false, error: 'Lead id is required' };
    }
    const name = input.name?.trim();
    if (!name) {
        return { success: false, error: 'Name is required' };
    }
    try {
        const existing = await getDocumentById(id);
        if (!existing || existing.type !== 'lead') {
            return { success: false, error: 'Lead not found' };
        }
        const stage: 'lead' | 'potential_client' = input.clientStage === 'potential_client' ? 'potential_client' : 'lead';
        const tags = Array.from(new Set([
            ...existing.tags.filter((tag) => tag !== 'lead' && tag !== 'potential_client'),
            'client',
            stage,
        ]));
        const updated: DocumentData = {
            ...existing,
            customer: {
                ...existing.customer,
                name,
                email: input.email?.trim() || undefined,
                phone: input.phone?.trim() || undefined,
                address: input.address?.trim() || undefined,
                clientStage: stage,
            },
            notes: input.notes?.trim() || undefined,
            tags,
            updatedAt: new Date().toISOString(),
        };
        await saveNewDocument(updated);
        revalidatePath('/admin');
        revalidatePath('/admin/leads');
        revalidatePath(`/admin/leads/${id}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to update lead', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to update client: ${message}` };
    }
}

export async function deleteLeadAction(input: { id: string }): Promise<{ success: boolean; error?: string }> {
    const id = input.id?.trim();
    if (!id) {
        return { success: false, error: 'Lead id is required' };
    }
    try {
        const existing = await getDocumentById(id);
        if (!existing || existing.type !== 'lead') {
            return { success: false, error: 'Lead not found' };
        }
        await deleteDocument('lead', id);
        revalidatePath('/admin');
        revalidatePath('/admin/leads');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete lead', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to delete client: ${message}` };
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
