/**
 * Fallback sender for outbound mail.
 *
 * Kept as a thin alias so existing references stay valid: the resolution
 * order (EMAIL_FROM → the business contact email configured in Settings →
 * a neutral placeholder) lives in email-branding.ts, and there is no longer
 * a brand-specific default in code. Production always sets EMAIL_FROM.
 */
export { resolveFromAddress as getFromAddress } from './email-branding';
