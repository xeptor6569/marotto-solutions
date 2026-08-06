'use server';

import { getDocumentById } from '@/lib/data';
import { createTransportFromEnv, getPublicSiteUrl } from '@/lib/email';
import { getEmailBrand } from '@/lib/email-branding';
import { buildDocumentShareUrl } from '@/lib/document-share-url';
import { DOC_LABEL } from '@/lib/document-labels';
import {
    hasPendingApprovalLines,
    pendingApprovalLineTotal,
    pendingApprovalSummarySentence,
} from '@/lib/pending-client-approval';
import { requireAdminAction } from '@/lib/require-admin-session';

export type EmailDocumentState = { success: boolean; error?: string };

function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export async function sendDocumentEmailAction(
    _prev: EmailDocumentState | undefined,
    formData: FormData,
): Promise<EmailDocumentState> {
    const gate = await requireAdminAction();
    if (!gate.ok) {
        return { success: false, error: 'You must be signed in to send email from the app.' };
    }
    const session = gate.session;

    const documentId = (formData.get('documentId') as string)?.trim();
    const toRaw = (formData.get('to') as string)?.trim();
    const message = (formData.get('message') as string)?.trim() || '';

    if (!documentId) {
        return { success: false, error: 'Missing document.' };
    }

    const doc = await getDocumentById(documentId);
    if (!doc) {
        return { success: false, error: 'Document not found.' };
    }
    if (doc.type === 'lead') {
        return { success: false, error: 'Email preview is not available for leads.' };
    }

    const to = toRaw || doc.customer.email?.trim();
    if (!to) {
        return { success: false, error: 'Enter a recipient email or add one on the customer record.' };
    }

    const transport = createTransportFromEnv();
    if (!transport) {
        return { success: false, error: 'Email is not configured. Set EMAIL_SERVER in the environment.' };
    }

    const brand = await getEmailBrand();
    const from = brand.from;
    const docTitle = DOC_LABEL[doc.type];
    const url = await buildDocumentShareUrl(doc, getPublicSiteUrl());
    const subject = `${brand.name} — ${docTitle} ${doc.id}`;
    const greeting = doc.customer.name ? `Hi ${doc.customer.name},` : 'Hello,';

    const pendingParagraph = hasPendingApprovalLines(doc.lineItems)
        ? pendingApprovalSummarySentence(docTitle, pendingApprovalLineTotal(doc.lineItems))
        : '';

    const textLines = [
        greeting,
        '',
        message ? `${message}\n` : '',
        pendingParagraph ? `${pendingParagraph}\n` : '',
        `View your ${docTitle}: ${url}`,
        '',
        'Thank you,',
        brand.name,
    ].filter((line, i, arr) => !(line === '' && arr[i - 1] === ''));

    const textBody = textLines.join('\n');

    const safeUrl = escapeHtml(url);
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p style="margin: 0 0 16px;">${escapeHtml(greeting)}</p>
  ${message ? `<p style="margin: 0 0 16px; white-space: pre-line;">${escapeHtml(message)}</p>` : ''}
  ${pendingParagraph ? `<p style="margin: 0 0 16px; color: #92400e;">${escapeHtml(pendingParagraph)}</p>` : ''}
  <p style="margin: 0 0 16px;">
    <a href="${safeUrl}" style="color: #4f46e5;">View your ${escapeHtml(docTitle)}</a>
  </p>
  <p style="margin: 0; color: #6b7280; font-size: 14px;">${safeUrl}</p>
  <p style="margin: 24px 0 0;">Thank you,<br />${escapeHtml(brand.name)}</p>
</body>
</html>`;

    try {
        await transport.sendMail({
            from,
            to,
            subject,
            text: textBody,
            html: htmlBody,
            replyTo: session.user?.email || undefined,
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to send email.';
        console.error('sendDocumentEmailAction', e);
        return { success: false, error: msg };
    }

    return { success: true };
}
