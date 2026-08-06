import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** True when a Stripe secret key is configured for Checkout. */
export function isStripeConfigured(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripeWebhookSecret(): string | null {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    return secret || null;
}

/** Lazy Stripe SDK client. Throws if STRIPE_SECRET_KEY is missing. */
export function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    if (!stripeClient) {
        stripeClient = new Stripe(key, {
            apiVersion: '2025-08-27.basil',
            typescript: true,
        });
    }
    return stripeClient;
}

export function getAppBaseUrl(): string {
    const raw = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || '').trim().replace(/\/$/, '');
    return raw || 'http://localhost:3081';
}
