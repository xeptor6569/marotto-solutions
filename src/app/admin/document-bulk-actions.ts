'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getDocumentById, getNextNumber, saveNewDocument } from '@/lib/data';
import { createTransportFromEnv, getPublicSiteUrl } from '@/lib/email';
import { DOC_LABEL } from '@/lib/document-labels';
import { buildConvertedDocument, canConvert } from '@/lib/convert-document';
import { hasPendingApprovalLines } from '@/lib/pending-client-approval';
import type { DocumentData, DocumentType } from '@/lib/types';

const PREFIX: Record<DocumentType, string> = {
    invoice: 'INV',
    estimate: 'EST',
    quote: 'QTE',
    receipt: 'RCT',
    lead: 'LEAD',
};

function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildViewUrl(doc: DocumentData): string {
    const base = getPublicSiteUrl();
    if (doc.type === 'lead') return `${base}/`;
    return `${base}/${doc.type}s/${encodeURIComponent(doc.id)}`;
}

export interface BulkDuplicateResult {
    success: boolean;
    error?: string;
    count?: number;
    ids?: string[];
}

/**
 * Duplicate one or more documents. Each copy is a fresh draft with a new
 * number/id, cleared payments, and no contract linkage.
 */
export async function duplicateDocumentsAction(ids: string[]): Promise<BulkDuplicateResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No documents selected.' };
    }

    const newIds: string[] = [];
    const touchedTypes = new Set<DocumentType>();

    try {
        for (const id of ids) {
            const doc = await getDocumentById(id);
            if (!doc) continue;

            const number = await getNextNumber(doc.type);
            const newId = `${PREFIX[doc.type]}-${String(number).padStart(4, '0')}`;
            const now = new Date().toISOString();

            const copy: DocumentData = {
                ...doc,
                id: newId,
                number,
                status: 'draft',
                createdAt: now,
                updatedAt: now,
                payments: [],
                paidAmount: 0,
                balanceDue: doc.total,
                lineItems: doc.lineItems.map((item) => ({ ...item })),
                customer: { ...doc.customer },
                title: doc.title ? `${doc.title} (copy)` : undefined,
            };
            delete copy.contractId;
            delete copy.contractCycle;

            await saveNewDocument(copy);
            newIds.push(newId);
            touchedTypes.add(doc.type);
        }
    } catch (e: unknown) {
        console.error('duplicateDocumentsAction', e);
        return { success: false, error: e instanceof Error ? e.message : 'Failed to duplicate documents.' };
    }

    revalidatePath('/admin');
    for (const type of touchedTypes) {
        revalidatePath(`/admin/${type}s`);
    }

    return { success: true, count: newIds.length, ids: newIds };
}

export interface BulkConvertResult {
    success: boolean;
    error?: string;
    count?: number;
    ids?: string[];
    /** Set when an invoice conversion needs confirmation for pending-approval scope. */
    requiresConfirmation?: boolean;
    /** Number of selected documents that could not be converted to the target type. */
    skipped?: number;
}

/**
 * Convert one or more documents to a new target type. Each converted document
 * is a fresh draft (new number/id) linked back to its source via tags.
 * Documents whose type cannot convert to `targetType` are skipped.
 */
export async function convertDocumentsAction(
    ids: string[],
    targetType: DocumentType,
    confirmPending?: boolean,
): Promise<BulkConvertResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in.' };
    }
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No documents selected.' };
    }

    const docs: DocumentData[] = [];
    for (const id of ids) {
        const doc = await getDocumentById(id);
        if (doc) docs.push(doc);
    }

    const convertible = docs.filter((doc) => canConvert(doc.type, targetType));
    const skipped = docs.length - convertible.length;

    if (convertible.length === 0) {
        return { success: false, error: `None of the selected documents can be converted to a ${DOC_LABEL[targetType].toLowerCase()}.` };
    }

    if (
        targetType === 'invoice'
        && !confirmPending
        && convertible.some((doc) => hasPendingApprovalLines(doc.lineItems))
    ) {
        return {
            success: false,
            requiresConfirmation: true,
            error: 'Some selected documents have scope pending client approval. Confirm to bill all line items.',
        };
    }

    const newIds: string[] = [];

    try {
        for (const doc of convertible) {
            const number = await getNextNumber(targetType);
            const converted = buildConvertedDocument(doc, targetType, number);
            await saveNewDocument(converted);
            newIds.push(converted.id);
        }
    } catch (e: unknown) {
        console.error('convertDocumentsAction', e);
        return { success: false, error: e instanceof Error ? e.message : 'Failed to convert documents.' };
    }

    revalidatePath('/admin');
    revalidatePath(`/admin/${targetType}s`);
    for (const doc of convertible) {
        revalidatePath(`/admin/${doc.type}s`);
    }

    return { success: true, count: newIds.length, ids: newIds, skipped: skipped > 0 ? skipped : undefined };
}

export interface BulkSendResult {
    success: boolean;
    error?: string;
    /** Number of recipients emailed. */
    recipients?: number;
    /** Number of documents included across all emails. */
    documents?: number;
    /** Documents skipped because they had no recipient email. */
    skipped?: number;
}

/**
 * Send selected documents grouped by recipient: each recipient receives a
 * single email listing links to all of their selected documents.
 */
export async function sendDocumentsAction(ids: string[], message?: string): Promise<BulkSendResult> {
    const session = await auth();
    if (!session) {
        return { success: false, error: 'You must be signed in to send email.' };
    }
    if (!ids || ids.length === 0) {
        return { success: false, error: 'No documents selected.' };
    }

    const transport = createTransportFromEnv();
    if (!transport) {
        return { success: false, error: 'Email is not configured. Set EMAIL_SERVER in the environment.' };
    }

    // Group docs by recipient email (case-insensitive), preserving display name.
    const groups = new Map<string, { email: string; name?: string; docs: DocumentData[] }>();
    let skipped = 0;

    for (const id of ids) {
        const doc = await getDocumentById(id);
        if (!doc) continue;
        const email = doc.customer.email?.trim();
        if (!email) {
            skipped++;
            continue;
        }
        const key = email.toLowerCase();
        const group = groups.get(key);
        if (group) {
            group.docs.push(doc);
        } else {
            groups.set(key, { email, name: doc.customer.name, docs: [doc] });
        }
    }

    if (groups.size === 0) {
        return { success: false, error: 'None of the selected documents have a recipient email.', skipped };
    }

    const from = process.env.EMAIL_FROM || 'noreply@marotto-solutions.com';
    const trimmedMessage = (message || '').trim();
    let documentsSent = 0;

    try {
        for (const { email, name, docs } of groups.values()) {
            const greeting = name ? `Hi ${name},` : 'Hello,';
            const subject = docs.length === 1
                ? `Marotto Solutions — ${DOC_LABEL[docs[0].type]} ${docs[0].id}`
                : `Marotto Solutions — ${docs.length} documents`;

            const listText = docs
                .map((d) => `- ${DOC_LABEL[d.type]} ${d.id} ($${d.total.toFixed(2)}): ${buildViewUrl(d)}`)
                .join('\n');

            const textBody = [
                greeting,
                '',
                trimmedMessage ? `${trimmedMessage}\n` : '',
                docs.length === 1 ? 'Here is your document:' : 'Here are your documents:',
                listText,
                '',
                'Thank you,',
                'Marotto Solutions',
            ].filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n');

            const listHtml = docs
                .map((d) => {
                    const url = escapeHtml(buildViewUrl(d));
                    return `<li style="margin: 0 0 8px;"><a href="${url}" style="color: #4f46e5;">${escapeHtml(DOC_LABEL[d.type])} ${escapeHtml(d.id)}</a> — $${d.total.toFixed(2)}</li>`;
                })
                .join('');

            const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p style="margin: 0 0 16px;">${escapeHtml(greeting)}</p>
  ${trimmedMessage ? `<p style="margin: 0 0 16px; white-space: pre-line;">${escapeHtml(trimmedMessage)}</p>` : ''}
  <p style="margin: 0 0 8px;">${docs.length === 1 ? 'Here is your document:' : 'Here are your documents:'}</p>
  <ul style="margin: 0 0 16px; padding-left: 20px;">${listHtml}</ul>
  <p style="margin: 24px 0 0;">Thank you,<br />Marotto Solutions</p>
</body></html>`;

            await transport.sendMail({
                from,
                to: email,
                subject,
                text: textBody,
                html: htmlBody,
                replyTo: session.user?.email || undefined,
            });
            documentsSent += docs.length;
        }
    } catch (e: unknown) {
        console.error('sendDocumentsAction', e);
        return { success: false, error: e instanceof Error ? e.message : 'Failed to send email.' };
    }

    return { success: true, recipients: groups.size, documents: documentsSent, skipped };
}
