import { getBusiness } from './branding';

/**
 * Shared branding for all outbound email. Every sender must pull its From
 * address and business name from here instead of hardcoding either.
 */

/** Outbound From address: env override, else the configured business email, else a neutral fallback. */
export function resolveFromAddress(business?: { email?: string }): string {
    return process.env.EMAIL_FROM?.trim() || business?.email?.trim() || 'noreply@localhost';
}

export interface EmailBrand {
    /** Business display name for subjects, greetings, and signatures. */
    name: string;
    /** From address for outbound mail. */
    from: string;
}

export async function getEmailBrand(): Promise<EmailBrand> {
    const business = await getBusiness();
    return { name: business.name, from: resolveFromAddress(business) };
}
