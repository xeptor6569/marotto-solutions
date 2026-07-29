'use server';

import { signOut } from '@/lib/auth';
import { getAppConfig, saveAppConfig } from '@/lib/config';
import { AppConfig, BillingConfig, DocumentData, Customer, DocumentType, PaymentEntry, PaymentKind, PaymentMethodKey, WorkflowStatus } from '@/lib/types';
import { parseDocumentFormMode } from '@/lib/document-form-mode';
import { checkConnection } from '@/lib/webdav';
import { saveNewDocument, getNextNumber, getDocumentById, deleteDocument } from '@/lib/data';
import { parseLineItemsFromFormData } from '@/lib/parse-line-items';
import {
    parseChoiceGroupsFromFormData,
    parsePackagesFromFormData,
} from '@/lib/parse-document-options';
import {
    buildOptionSelection,
    documentDisplayTotal,
    documentHasOptions,
    isOptionSelectionComplete,
    resolveSelectedLineItems,
    sanitizeOptionSelection,
} from '@/lib/document-options';
import { parseEstimatedHours } from '@/lib/job-estimated-hours';
import {
    buildDepositInvoiceDraft,
    type DepositMode,
} from '@/lib/deposit-invoice';
import { buildConvertedDocument, canConvert } from '@/lib/convert-document';
import { hasPendingApprovalLines } from '@/lib/pending-client-approval';
import { createJob, getJobById, getJobOptions } from '@/lib/jobs';
import { suggestDocumentTitle } from '@/lib/document-labels';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isDatabaseConfigured } from '@/lib/prisma';
import { upsertProspectFromQuoteRequest } from '@/lib/quote-intake';
import {
    sendQuoteRequestAdminEmail,
    sendQuoteRequestConfirmationEmail,
} from '@/lib/quote-request-email';
import {
    parseFormStatus,
    resolveDocumentStatus,
    validateRecordPayment,
} from '@/lib/document-save';
import {
    requireAdminAction,
    requireAdminActionOrRedirect,
} from '@/lib/require-admin-session';

function getPaymentKind(raw: string | null): PaymentKind {
    if (raw === 'down_payment') return 'down_payment';
    if (raw === 'final') return 'final';
    return 'partial';
}

export async function saveSettingsAction(formData: FormData) {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const url = ((formData.get('webdavUrl') as string) || '').trim();
    const username = ((formData.get('webdavUsername') as string) || '').trim();
    const password = ((formData.get('webdavPassword') as string) || '').trim();
    const checkPayableTo = ((formData.get('checkPayableTo') as string) || '').trim();
    const paymentInstructions = ((formData.get('paymentInstructions') as string) || '').trim();
    const businessTimezone = ((formData.get('businessTimezone') as string) || '').trim();
    const documentFormMode = parseDocumentFormMode(formData.get('documentFormMode'));
    const paymentMethodKeys: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];
    const currentConfig = await getAppConfig();

    const orderRaw = ((formData.get('paymentMethodOrder') as string) || '').trim();
    const orderedKeys = orderRaw
        .split(',')
        .map((k) => k.trim())
        .filter((k): k is PaymentMethodKey => (paymentMethodKeys as string[]).includes(k));
    const positionByKey = new Map<PaymentMethodKey, number>();
    orderedKeys.forEach((key, index) => positionByKey.set(key, index));
    // Any keys missing from the submitted order keep a stable position after the ordered ones.
    let fallbackPosition = orderedKeys.length;
    for (const key of paymentMethodKeys) {
        if (!positionByKey.has(key)) {
            positionByKey.set(key, fallbackPosition++);
        }
    }

    const configUpdate: Partial<AppConfig> = {
        webdavUrl: url,
        webdavUsername: username,
        webdavPassword: password, // Note: Storing plain text password locally. Ideal? No. Functional for self-hosted? Yes.
        businessTimezone: businessTimezone || undefined,
        documentFormMode,
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
                    position: positionByKey.get(key) ?? existing?.position ?? 0,
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
    revalidatePath('/admin');
    revalidatePath('/admin/calendar');
    return { success: true };
}

export async function createDepositInvoiceAction(input: {
    sourceDocumentId: string;
    mode: DepositMode;
    value: number;
}): Promise<{ success: false; error: string } | never> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const sourceId = input.sourceDocumentId?.trim();
    if (!sourceId) {
        return { success: false, error: 'Source document is required.' };
    }

    try {
        const source = await getDocumentById(sourceId);
        if (!source || (source.type !== 'quote' && source.type !== 'estimate')) {
            return { success: false, error: 'Source quote or estimate not found.' };
        }
        if (documentHasOptions(source) && !isOptionSelectionComplete(source)) {
            return {
                success: false,
                error: 'Select a package and required material options before creating a deposit invoice.',
            };
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

export async function createConvertedDocumentAction(input: {
    sourceDocumentId: string;
    targetType: DocumentType;
    confirmPending?: boolean;
}): Promise<{ success: false; error: string; requiresConfirmation?: boolean } | never> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const sourceId = input.sourceDocumentId?.trim();
    if (!sourceId) {
        return { success: false, error: 'Source document is required.' };
    }

    try {
        const source = await getDocumentById(sourceId);
        if (!source) {
            return { success: false, error: 'Source document not found.' };
        }
        if (!canConvert(source.type, input.targetType)) {
            return { success: false, error: 'This conversion is not supported.' };
        }

        if (
            input.targetType === 'invoice'
            && documentHasOptions(source)
            && !isOptionSelectionComplete(source)
        ) {
            return {
                success: false,
                error: 'Select a package and required material options before converting to an invoice.',
            };
        }

        if (
            input.targetType === 'invoice'
            && hasPendingApprovalLines(resolveSelectedLineItems(source))
            && !input.confirmPending
        ) {
            return {
                success: false,
                requiresConfirmation: true,
                error: 'This document has scope pending client approval. Confirm to bill all line items on the invoice.',
            };
        }

        const number = await getNextNumber(input.targetType);
        const doc = buildConvertedDocument(source, input.targetType, number);
        await saveNewDocument(doc);

        revalidatePath('/admin');
        revalidatePath(`/admin/${input.targetType}s`);
        revalidatePath(`/admin/${source.type}s`);
        revalidatePath(`/admin/${source.type}s/${source.id}`);
        revalidatePath(`/admin/${input.targetType}s/${doc.id}`);
        revalidatePath(`/admin/${input.targetType}s/${doc.id}/edit`);

        redirect(`/admin/${input.targetType}s/${doc.id}/edit`);
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) {
            const digest = String((error as { digest?: string }).digest ?? '');
            if (digest.startsWith('NEXT_REDIRECT')) {
                throw error;
            }
        }
        console.error('Failed to convert document', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function createInvoiceAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin');
    const documentId = formData.get('documentId') as string | null;
    const createdAt = (formData.get('createdAt') as string) || new Date().toISOString();
    const redirectToInput = ((formData.get('redirectTo') as string) || '').trim();
    const number = Number(formData.get('number'));
    const date = formData.get('date') as string;
    const dueDate = formData.get('dueDate') as string;
    const notes = (formData.get('notes') as string) || '';
    const title = ((formData.get('title') as string) || '').trim();
    const type = (formData.get('type') as string) as DocumentType || 'invoice';
    const currentStatus = parseFormStatus(formData.get('currentStatus') as string | null, 'draft');
    const formStatus = parseFormStatus(formData.get('status') as string | null, currentStatus);
    const intent = formData.get('intent') as string | null;
    const paymentAmount = Number(formData.get('paymentAmount') || 0);
    const paymentDate = (formData.get('paymentDate') as string) || new Date().toISOString().split('T')[0];
    const paymentMethod = (formData.get('paymentMethod') as string) || '';
    const paymentNotes = (formData.get('paymentNotes') as string) || '';
    const selectedClientId = (formData.get('clientId') as string) || '';
    const selectedJobId = (formData.get('jobId') as string) || '';

    const warrantyEnabled = formData.has('warrantyEnabled');
    const warrantyText = ((formData.get('warrantyText') as string) || '').trim();
    const warrantyTitle = ((formData.get('warrantyTitle') as string) || '').trim();
    const warranty = (warrantyEnabled && warrantyText)
        ? { enabled: true, title: warrantyTitle || undefined, text: warrantyText }
        : undefined;

    const customizeMethods = formData.has('customizePaymentMethods');
    const allPaymentMethodKeys: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];
    const enabledMethods = allPaymentMethodKeys.filter((key) => formData.has(`invoiceMethod.${key}`));
    const stripeLink = ((formData.get('invoiceStripeLink') as string) || '').trim();
    const stripeNote = ((formData.get('invoiceStripeNote') as string) || '').trim();
    const paymentOverrides = (type === 'invoice' && (customizeMethods || stripeLink))
        ? {
            ...(customizeMethods ? { customizeMethods: true, enabledMethods } : {}),
            ...(stripeLink ? { stripeLink, ...(stripeNote ? { stripeNote } : {}) } : {}),
        }
        : undefined;

    const customer: Customer = {
        id: crypto.randomUUID(),
        name: formData.get('customerName') as string,
        email: formData.get('customerEmail') as string,
        address: formData.get('customerAddress') as string,
        phone: ((formData.get('customerPhone') as string) || '').trim() || undefined,
        clientId: selectedClientId || undefined,
        jobId: selectedJobId || undefined,
    };

    const items = parseLineItemsFromFormData(formData);
    if (items.length === 0) {
        throw new Error('Add at least one line item before saving.');
    }

    let resolvedTitle = title;
    if (!resolvedTitle) {
        let jobName: string | undefined;
        if (selectedJobId) {
            try {
                const job = await getJobById(selectedJobId);
                jobName = job?.name;
            } catch {
                // Ignore — title suggestion can fall back to line items.
            }
        }
        resolvedTitle = suggestDocumentTitle(items, jobName) || '';
    }

    const supportsOptions = type === 'estimate' || type === 'quote';
    const estimatedHours = supportsOptions
        ? parseEstimatedHours(formData.get('estimatedHours'))
        : undefined;
    const packages = supportsOptions ? parsePackagesFromFormData(formData) : undefined;
    const choiceGroups = supportsOptions ? parseChoiceGroupsFromFormData(formData) : undefined;

    let existingOptionSelection: DocumentData['optionSelection'];
    if (supportsOptions && documentId) {
        try {
            const existing = await getDocumentById(documentId);
            if (existing && (existing.type === 'estimate' || existing.type === 'quote')) {
                existingOptionSelection = existing.optionSelection;
            }
        } catch {
            // Ignore — new docs or missing prior selection.
        }
    }

    const optionSelection = supportsOptions
        ? sanitizeOptionSelection({
            packages,
            choiceGroups,
            optionSelection: existingOptionSelection,
        })
        : undefined;

    const displayTotal = supportsOptions
        ? documentDisplayTotal({
            lineItems: items,
            packages,
            choiceGroups,
            optionSelection,
        })
        : items.reduce((acc, item) => acc + item.total, 0);
    const subtotal = displayTotal;
    const total = displayTotal;

    const prefix =
        type === 'invoice' ? 'INV' :
        type === 'estimate' ? 'EST' :
        type === 'quote' ? 'QTE' :
        'RCT';

    const existingPayments = initialDataPayments(formData);
    const existingPaidAmount = Number(formData.get('paidAmount') || 0)
        || existingPayments.reduce((acc, payment) => acc + payment.amount, 0);
    const existingBalanceDue = Math.max(0, total - existingPaidAmount);

    if (type === 'invoice' && intent === 'record_payment') {
        const paymentError = validateRecordPayment(paymentAmount, existingBalanceDue);
        if (paymentError) {
            throw new Error(paymentError);
        }
    }

    const status = resolveDocumentStatus({
        type,
        intent,
        formStatus,
        balanceDue: existingBalanceDue,
        paidAmount: existingPaidAmount,
    });

    const doc: DocumentData = {
        id: documentId || `${prefix}-${String(number).padStart(4, '0')}`,
        ...(resolvedTitle ? { title: resolvedTitle } : {}),
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
        payments: existingPayments,
        paidAmount: existingPaidAmount,
        balanceDue: existingBalanceDue,
        ...(warranty ? { warranty } : {}),
        ...(paymentOverrides ? { paymentOverrides } : {}),
        ...((type === 'estimate' || type === 'quote') && formData.get('workflowStatus')
            ? { workflowStatus: formData.get('workflowStatus') as WorkflowStatus }
            : {}),
        ...(estimatedHours !== undefined ? { estimatedHours } : {}),
        ...(supportsOptions && packages && packages.length > 0 ? { packages } : {}),
        ...(supportsOptions && choiceGroups && choiceGroups.length > 0 ? { choiceGroups } : {}),
        ...(supportsOptions && optionSelection ? { optionSelection } : {}),
    };

    let createdReceiptId: string | null = null;

    if (type === 'invoice' && intent === 'record_payment' && paymentAmount > 0) {
        const paymentEntry: PaymentEntry = {
            id: crypto.randomUUID(),
            amount: paymentAmount,
            date: new Date(paymentDate).toISOString(),
            method: paymentMethod || undefined,
            notes: paymentNotes || undefined,
            kind: getPaymentKind(formData.get('paymentKind') as string | null),
        };
        const payments = [...(doc.payments || []), paymentEntry];
        const paidAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
        const balanceDue = Math.max(0, doc.total - paidAmount);
        doc.payments = payments;
        doc.paidAmount = paidAmount;
        doc.balanceDue = balanceDue;
        doc.status = balanceDue <= 0 ? 'paid' : (doc.status === 'draft' ? 'sent' : doc.status);
    } else {
        doc.balanceDue = Math.max(0, doc.total - (doc.paidAmount || 0));
        doc.status = resolveDocumentStatus({
            type,
            intent,
            formStatus,
            balanceDue: doc.balanceDue,
            paidAmount: doc.paidAmount || 0,
        });
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
                createdReceiptId = receiptId;
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
    if (selectedJobId) {
        revalidatePath('/admin/jobs');
        revalidatePath(`/admin/jobs/${selectedJobId}`);
    }
    revalidatePath(`/admin/${type}s`);
    revalidatePath(`/${type}s`);
    revalidatePath(`/admin/${type}s/${doc.id}`);
    revalidatePath(`/${type}s/${doc.id}`);

    let redirectTo =
        redirectToInput && !['/admin', '/dashboard'].includes(redirectToInput)
            ? redirectToInput
            : type === 'lead'
                ? `/admin/leads/${doc.id}`
                : `/admin/${type}s/${doc.id}`;

    if (createdReceiptId) {
        const separator = redirectTo.includes('?') ? '&' : '?';
        redirectTo = `${redirectTo}${separator}recorded=1&receipt=${encodeURIComponent(createdReceiptId)}`;
    }

    redirect(redirectTo);
}

export async function createLeadAction(formData: FormData) {
    await requireAdminActionOrRedirect('/admin/leads/create');
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
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false as const, error: gate.error };

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
    const gate = await requireAdminAction();
    if (!gate.ok) return [];
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
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

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
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

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

const DELETABLE_DOC_TYPES: DocumentType[] = ['invoice', 'estimate', 'quote', 'receipt'];

export async function deleteAdminDocumentAction(input: {
    id: string;
    redirectTo?: string;
}): Promise<{ success: boolean; error?: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const id = input.id?.trim();
    if (!id) {
        return { success: false, error: 'Document id is required' };
    }

    let redirectTo: string | undefined;
    try {
        const existing = await getDocumentById(id);
        if (!existing || !DELETABLE_DOC_TYPES.includes(existing.type)) {
            return { success: false, error: 'Document not found' };
        }

        await deleteDocument(existing.type, id);

        const listPath = `/admin/${existing.type}s`;
        revalidatePath('/admin');
        revalidatePath(listPath);
        const jobId = existing.jobId || existing.customer?.jobId;
        if (jobId) {
            revalidatePath('/admin/jobs');
            revalidatePath(`/admin/jobs/${jobId}`);
        }

        const requested = input.redirectTo?.trim();
        if (requested && requested.startsWith('/admin') && !requested.startsWith('//')) {
            redirectTo = requested;
        }
    } catch (error) {
        console.error('Failed to delete document', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to delete document: ${message}` };
    }

    if (redirectTo) {
        redirect(redirectTo);
    }
    return { success: true };
}

export async function submitQuoteRequest(formData: FormData) {
    const name = ((formData.get('name') as string) || '').trim();
    const email = ((formData.get('email') as string) || '').trim();
    const service = ((formData.get('service') as string) || 'general').trim();
    const details = ((formData.get('details') as string) || '').trim();
    const date = ((formData.get('date') as string) || '').trim();

    if (!name || !email || !details) {
        redirect('/?error=missing');
    }

    const input = { name, email, service, details, date };

    let clientId: string | undefined;
    if (isDatabaseConfigured()) {
        const saved = await upsertProspectFromQuoteRequest(input);
        if (saved.ok) {
            clientId = saved.clientId;
            revalidatePath('/admin/clients');
            revalidatePath('/admin');
        } else {
            console.error('submitQuoteRequest: failed to save prospect', saved.error);
        }
    } else {
        console.error('submitQuoteRequest: DATABASE_URL not configured');
    }

    // Notify admin and confirm to submitter (best-effort; don't block success UX)
    const [adminResult, confirmResult] = await Promise.all([
        sendQuoteRequestAdminEmail(input, clientId),
        sendQuoteRequestConfirmationEmail(input),
    ]);
    if (!adminResult.ok) {
        console.error('submitQuoteRequest: admin email failed', adminResult.error);
    }
    if (!confirmResult.ok) {
        console.error('submitQuoteRequest: confirmation email failed', confirmResult.error);
    }

    if (!clientId && isDatabaseConfigured()) {
        redirect('/?error=save');
    }

    redirect('/?submitted=true');
}

export async function updateWorkflowStatusAction(docId: string, workflowStatus: WorkflowStatus | undefined) {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const doc = await getDocumentById(docId);
    if (!doc || (doc.type !== 'estimate' && doc.type !== 'quote')) {
        return { success: false, error: 'Document not found or not an estimate/quote.' };
    }
    doc.workflowStatus = workflowStatus;
    doc.updatedAt = new Date().toISOString();
    await saveNewDocument(doc);
    revalidatePath('/admin/estimates');
    revalidatePath('/admin/quotes');
    revalidatePath(`/admin/estimates/${docId}`);
    revalidatePath(`/admin/quotes/${docId}`);
    return { success: true };
}

/** Admin selects the winning package and choice-group answers on an estimate/quote. */
export async function updateDocumentOptionSelectionAction(input: {
    documentId: string;
    packageId?: string | null;
    choices?: Record<string, string>;
}): Promise<{ success: true } | { success: false; error: string }> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const documentId = input.documentId?.trim();
    if (!documentId) {
        return { success: false, error: 'Document is required.' };
    }

    try {
        const doc = await getDocumentById(documentId);
        if (!doc || (doc.type !== 'estimate' && doc.type !== 'quote')) {
            return { success: false, error: 'Document not found or not an estimate/quote.' };
        }
        if (!documentHasOptions(doc)) {
            return { success: false, error: 'This document has no packages or choice groups.' };
        }

        const optionSelection = sanitizeOptionSelection({
            packages: doc.packages,
            choiceGroups: doc.choiceGroups,
            optionSelection: buildOptionSelection({
                packageId: input.packageId,
                choices: input.choices,
                by: 'admin',
            }),
        });

        doc.optionSelection = optionSelection;
        const total = documentDisplayTotal(doc);
        doc.subtotal = total;
        doc.total = total;
        doc.updatedAt = new Date().toISOString();
        await saveNewDocument(doc);

        revalidatePath('/admin');
        revalidatePath(`/admin/${doc.type}s`);
        revalidatePath(`/admin/${doc.type}s/${doc.id}`);
        revalidatePath(`/d`);
        if (doc.shareToken) {
            revalidatePath(`/d/${doc.shareToken}`);
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to update option selection', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}
