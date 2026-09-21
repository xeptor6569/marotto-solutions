/**
 * Fallback sender for outbound mail.
 *
 * Production always sets EMAIL_FROM — the deploy workflow fails without it — so
 * this only applies to local runs and the dev stack. It lives in one place so a
 * domain change is a single edit rather than a hunt through every module that
 * sends mail.
 *
 * Note this is a mail domain, which does not have to match the website domain;
 * change it only once the new sender is authenticated (SPF/DKIM/DMARC) with the
 * SMTP provider.
 */
export const DEFAULT_FROM_ADDRESS = 'noreply@marotto-solutions.com';

/** Configured sender, or the fallback above. */
export function getFromAddress(): string {
    return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM_ADDRESS;
}
