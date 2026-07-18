import nodemailer from 'nodemailer';
import type { DocumentData, CalendarEventRecord } from './types';
import { formatInTimeZone } from 'date-fns-tz';
import { buildDocumentShareUrl } from './document-share-url';

export function createTransportFromEnv() {
    const server = process.env.EMAIL_SERVER;
    if (!server) return null;
    return nodemailer.createTransport(server);
}

/** Base URL for links in outbound emails (no trailing slash). */
export function getPublicSiteUrl(): string {
    const raw = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const trimmed = raw.replace(/\/$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
}

function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export interface SendInvoiceEmailResult {
    ok: boolean;
    error?: string;
}

/**
 * Send a generated contract-cycle invoice to the customer without requiring
 * an authenticated session. Used by the scheduled cron run, so it only sends
 * when the document has a recipient email and EMAIL_SERVER is configured.
 */
export async function sendContractInvoiceEmail(invoice: DocumentData): Promise<SendInvoiceEmailResult> {
    const transport = createTransportFromEnv();
    if (!transport) {
        return { ok: false, error: 'Email is not configured (EMAIL_SERVER missing).' };
    }
    const to = invoice.customer?.email?.trim();
    if (!to) {
        return { ok: false, error: 'Customer has no email on file.' };
    }
    const from = process.env.EMAIL_FROM || 'noreply@marotto-solutions.com';
    const url = await buildDocumentShareUrl(invoice, getPublicSiteUrl());
    const cycleLabel = invoice.contractCycle ? `Cycle ${invoice.contractCycle}` : 'New invoice';
    const subject = `Marotto Solutions — ${cycleLabel} ${invoice.id}`;
    const greeting = invoice.customer?.name ? `Hi ${invoice.customer.name},` : 'Hello,';

    const textBody = [
        greeting,
        '',
        `Your latest service invoice is ready.`,
        `Amount due: $${invoice.total.toFixed(2)}.`,
        invoice.dueDate ? `Due date: ${new Date(invoice.dueDate).toLocaleDateString()}.` : '',
        '',
        `View it online: ${url}`,
        '',
        'Thank you,',
        'Marotto Solutions',
    ].filter(Boolean).join('\n');

    const safeUrl = escapeHtml(url);
    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p style="margin: 0 0 16px;">${escapeHtml(greeting)}</p>
  <p style="margin: 0 0 16px;">Your latest service invoice is ready.</p>
  <p style="margin: 0 0 16px;">
    <strong>Amount due:</strong> $${invoice.total.toFixed(2)}<br />
    ${invoice.dueDate ? `<strong>Due date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}` : ''}
  </p>
  <p style="margin: 0 0 16px;"><a href="${safeUrl}" style="color: #4f46e5;">View invoice</a></p>
  <p style="margin: 0; color: #6b7280; font-size: 14px;">${safeUrl}</p>
  <p style="margin: 24px 0 0;">Thank you,<br />Marotto Solutions</p>
</body></html>`;

    try {
        await transport.sendMail({ from, to, subject, text: textBody, html: htmlBody });
        return { ok: true };
    } catch (error) {
        console.error('sendContractInvoiceEmail', error);
        const message = error instanceof Error ? error.message : 'Failed to send email';
        return { ok: false, error: message };
    }
}

export async function sendCalendarEventReminderEmail(
    event: CalendarEventRecord,
    businessTimezone: string,
): Promise<SendInvoiceEmailResult> {
    const transport = createTransportFromEnv();
    if (!transport) {
        return { ok: false, error: 'Email is not configured (EMAIL_SERVER missing).' };
    }

    const from = process.env.EMAIL_FROM || 'noreply@marotto-solutions.com';
    const to = process.env.OPERATOR_EMAIL || from;
    const startLocal = formatInTimeZone(new Date(event.start), businessTimezone, event.allDay ? 'MMMM d, yyyy' : 'MMMM d, yyyy h:mm a z');

    const subject = `Reminder: ${event.title} — ${startLocal}`;

    const lines = [
        `Upcoming event: ${event.title}`,
        `Starts: ${startLocal}`,
        event.allDay ? 'All day event' : null,
        event.location ? `Location: ${event.location}` : null,
        event.clientName ? `Client: ${event.clientName}` : null,
        event.jobName ? `Job: ${event.jobName}` : null,
    ].filter((l): l is string => l !== null);

    const textBody = [
        'This is a reminder for an upcoming scheduled event.',
        '',
        ...lines,
        '',
        '— Marotto Solutions Calendar',
    ].join('\n');

    const safeLines = lines.map((l) => `<p style="margin:0 0 8px;">${escapeHtml(l)}</p>`).join('\n');
    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;color:#111827;">
  <p style="margin:0 0 16px;">This is a reminder for an upcoming scheduled event.</p>
  ${safeLines}
  <p style="margin:24px 0 0;color:#6b7280;">— Marotto Solutions Calendar</p>
</body></html>`;

    try {
        await transport.sendMail({ from, to, subject, text: textBody, html: htmlBody });
        return { ok: true };
    } catch (error) {
        console.error('sendCalendarEventReminderEmail', error);
        const message = error instanceof Error ? error.message : 'Failed to send reminder email';
        return { ok: false, error: message };
    }
}
