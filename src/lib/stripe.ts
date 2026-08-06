import Stripe from 'stripe';
import { isProductionEnvironment } from './app-env';

let stripeClient: Stripe | null = null;

function isLiveKey(key: string): boolean {
    return key.startsWith('sk_live_') || key.startsWith('rk_live_');
}

/**
 * A live key outside production would let a dev or local instance create real
 * charges against real cards — restored production data makes that a realistic
 * accident, not a hypothetical one.
 */
function assertKeyAllowedForEnvironment(key: string): void {
    if (isLiveKey(key) && !isProductionEnvironment()) {
        throw new Error(
            'Refusing to use a live Stripe key outside production. Set STRIPE_SECRET_KEY to a test key (sk_test_…) on this instance.',
        );
    }
}

/** True when a usable Stripe secret key is configured for Checkout. */
export function isStripeConfigured(): boolean {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) return false;
    // Report unusable rather than configured, so the UI offers the other
    // payment methods instead of a Checkout button that always errors.
    return !(isLiveKey(key) && !isProductionEnvironment());
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
    assertKeyAllowedForEnvironment(key);
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
