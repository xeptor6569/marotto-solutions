import { createTransportFromEnv, getPublicSiteUrl } from '@/lib/email';
import { getFromAddress } from '@/lib/email-identity';
import { serviceLabel, type QuoteRequestInput } from '@/lib/quote-intake';

function escapeHtml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function adminNotificationEmail(): string {
    return (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM || '').trim();
}

export async function sendQuoteRequestAdminEmail(
    input: QuoteRequestInput,
    clientId?: string,
): Promise<{ ok: boolean; error?: string }> {
    const transport = createTransportFromEnv();
    if (!transport) {
        return { ok: false, error: 'Email is not configured.' };
    }

    const to = adminNotificationEmail();
    if (!to) {
        return { ok: false, error: 'No admin notification email configured.' };
    }

    const from = getFromAddress();
    const adminUrl = `${getPublicSiteUrl()}/admin/clients`;

    const subject = `New quote request — ${input.name.trim()}`;
    const service = serviceLabel(input.service);

    const textBody = [
        'New quote request from your website',
        '',
        `Name: ${input.name.trim()}`,
        `Email: ${input.email.trim()}`,
        `Phone: ${input.phone.trim()}`,
        `Service: ${service}`,
        input.date?.trim() ? `Preferred schedule: ${input.date.trim()}` : '',
        '',
        'Project details:',
        input.details.trim(),
        '',
        clientId ? `Saved as prospect in admin: ${adminUrl}` : 'Note: client record could not be saved — follow up manually.',
        '',
        'Marotto Solutions',
    ].filter(Boolean).join('\n');

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p style="margin: 0 0 16px;"><strong>New quote request</strong> from your website</p>
  <table style="margin: 0 0 16px; border-collapse: collapse;">
    <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Name</td><td>${escapeHtml(input.name.trim())}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Email</td><td><a href="mailto:${escapeHtml(input.email.trim())}">${escapeHtml(input.email.trim())}</a></td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Phone</td><td><a href="tel:${escapeHtml(input.phone.trim())}">${escapeHtml(input.phone.trim())}</a></td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Service</td><td>${escapeHtml(service)}</td></tr>
    ${input.date?.trim() ? `<tr><td style="padding: 4px 12px 4px 0; color: #6b7280;">Schedule</td><td>${escapeHtml(input.date.trim())}</td></tr>` : ''}
  </table>
  <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Project details</p>
  <p style="margin: 0 0 16px; white-space: pre-line;">${escapeHtml(input.details.trim())}</p>
  ${clientId ? `<p style="margin: 0;"><a href="${escapeHtml(adminUrl)}" style="color: #4f46e5;">View prospects in admin</a></p>` : '<p style="margin: 0; color: #b45309;">Client record could not be saved — follow up manually.</p>'}
</body></html>`;

    try {
        await transport.sendMail({ from, to, subject, text: textBody, html: htmlBody, replyTo: input.email.trim() });
        return { ok: true };
    } catch (error) {
        console.error('sendQuoteRequestAdminEmail', error);
        return { ok: false, error: error instanceof Error ? error.message : 'Failed to send admin email.' };
    }
}

export async function sendQuoteRequestConfirmationEmail(
    input: QuoteRequestInput,
): Promise<{ ok: boolean; error?: string }> {
    const transport = createTransportFromEnv();
    if (!transport) {
        return { ok: false, error: 'Email is not configured.' };
    }

    const to = input.email.trim();
    if (!to) {
        return { ok: false, error: 'No recipient email.' };
    }

    const from = getFromAddress();
    const siteUrl = getPublicSiteUrl();
    const greeting = input.name.trim() ? `Hi ${input.name.trim()},` : 'Hello,';

    const subject = 'We received your quote request — Marotto Solutions';
    const textBody = [
        greeting,
        '',
        'Thank you for reaching out to Marotto Solutions. We received your quote request and will review the details shortly.',
        'We typically get back to you within one business day with next steps, availability, and an estimate when possible.',
        '',
        `If you need to add anything, reply to this email or visit ${siteUrl}.`,
        '',
        'Thank you,',
        'Marotto Solutions',
    ].join('\n');

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #111827;">
  <p style="margin: 0 0 16px;">${escapeHtml(greeting)}</p>
  <p style="margin: 0 0 16px;">Thank you for reaching out to <strong>Marotto Solutions</strong>. We received your quote request and will review the details shortly.</p>
  <p style="margin: 0 0 16px;">We typically get back to you within one business day with next steps, availability, and an estimate when possible.</p>
  <p style="margin: 0 0 16px;">If you need to add anything, reply to this email or visit <a href="${escapeHtml(siteUrl)}" style="color: #4f46e5;">${escapeHtml(siteUrl)}</a>.</p>
  <p style="margin: 24px 0 0;">Thank you,<br />Marotto Solutions</p>
</body></html>`;

    try {
        await transport.sendMail({ from, to, subject, text: textBody, html: htmlBody });
        return { ok: true };
    } catch (error) {
        console.error('sendQuoteRequestConfirmationEmail', error);
        return { ok: false, error: error instanceof Error ? error.message : 'Failed to send confirmation email.' };
    }
}
