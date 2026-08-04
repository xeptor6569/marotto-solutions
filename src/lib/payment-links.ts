import type { PaymentMethodEntry, PaymentMethodKey } from './types';

export function normalizePhoneDigits(value?: string) {
    return (value || '').replace(/\D/g, '');
}

/** Strip leading @ / $ used by Venmo / Cash App style handles. */
export function normalizeHandle(value?: string) {
    return (value || '').trim().replace(/^[@$]+/, '');
}

export function toMoneyAmount(amount: number) {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return safeAmount.toFixed(2);
}

function firstPathSegment(pathname: string): string {
    return pathname.replace(/^\/+/, '').split('/')[0] || '';
}

/** Hosts we will 302-redirect to from /api/pay/redirect (open-redirect safe). */
export const PAYMENT_REDIRECT_ALLOWED_HOSTS = new Set([
    'paypal.me',
    'www.paypal.com',
    'paypal.com',
    'cash.app',
    'www.cash.app',
    'cash.me',
    'www.cash.me',
    'venmo.com',
    'www.venmo.com',
]);

export function isAllowedPaymentRedirectUrl(raw: string): boolean {
    try {
        const url = new URL(raw);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        return PAYMENT_REDIRECT_ALLOWED_HOSTS.has(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

/**
 * Resolve a PayPal.Me username from a handle or pasted paypal.me / paypal.com URL.
 * Amount/currency path segments (and query strings) are ignored.
 */
export function extractPaypalMeUser(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
        if (/^https?:\/\//i.test(trimmed) || /^(?:www\.)?paypal\.(?:me|com)\//i.test(trimmed)) {
            const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
            const host = url.hostname.replace(/^www\./i, '').toLowerCase();
            if (host === 'paypal.me') {
                const user = normalizeHandle(decodeURIComponent(firstPathSegment(url.pathname)));
                return user || null;
            }
            if (host === 'paypal.com') {
                const parts = url.pathname.replace(/^\/+/, '').split('/');
                if (parts[0]?.toLowerCase() === 'paypalme' && parts[1]) {
                    return normalizeHandle(decodeURIComponent(parts[1])) || null;
                }
            }
            return null;
        }
    } catch {
        return null;
    }

    // Plain handle (reject values that look like unrelated URLs/paths).
    if (trimmed.includes('/') || trimmed.includes('://')) return null;
    return normalizeHandle(trimmed) || null;
}

/**
 * Resolve a Cash App $cashtag from a handle or pasted cash.app / cash.me URL.
 */
export function extractCashTag(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
        if (/^https?:\/\//i.test(trimmed) || /^(?:www\.)?cash\.(?:app|me)\//i.test(trimmed)) {
            const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
            const host = url.hostname.replace(/^www\./i, '').toLowerCase();
            if (host === 'cash.app' || host === 'cash.me') {
                const parts = url.pathname.replace(/^\/+/, '').split('/');
                // Support /qr/$tag/... informational paths as well as /$tag/...
                const tagPart = parts[0]?.toLowerCase() === 'qr' ? parts[1] : parts[0];
                const tag = normalizeHandle(decodeURIComponent(tagPart || ''));
                return tag || null;
            }
            return null;
        }
    } catch {
        return null;
    }

    if (trimmed.includes('/') || trimmed.includes('://')) return null;
    return normalizeHandle(trimmed) || null;
}

/**
 * External deep link for a payment method (paypal.me / cash.app / venmo.com / …).
 *
 * PayPal native apps often ignore amount on universal links and open a bare
 * profile. Cash App is similarly unreliable when opened via target=_blank UL.
 * Prefer {@link paymentClickHref} for the actual button href so PayPal/Cash App
 * go through a same-origin redirect and stay in the browser with amount filled.
 */
export function paymentLinkForMethod(
    key: PaymentMethodKey,
    method: PaymentMethodEntry,
    amount: number,
    invoiceId: string,
): string | null {
    if (method.comingSoon) return null;
    const raw = (method.value || '').trim();
    const money = toMoneyAmount(amount);
    const encodedAmount = encodeURIComponent(money);
    const encodedNote = encodeURIComponent(`Invoice ${invoiceId}`);

    switch (key) {
        case 'paypal': {
            const paypalUser = extractPaypalMeUser(raw);
            // No currency code: PayPal's mobile app drops the amount when a
            // currency suffix is present and lands on the profile instead.
            return paypalUser ? `https://paypal.me/${encodeURIComponent(paypalUser)}/${money}` : null;
        }
        case 'venmo': {
            const venmoUser = normalizeHandle(raw);
            return venmoUser
                ? `https://venmo.com/${encodeURIComponent(venmoUser)}?txn=pay&amount=${encodedAmount}&note=${encodedNote}`
                : null;
        }
        case 'cashApp': {
            const cashTag = extractCashTag(raw);
            // Path amount form is the documented Cash App pay sheet deep link.
            return cashTag ? `https://cash.app/$${encodeURIComponent(cashTag)}/${money}` : null;
        }
        case 'zelle': {
            // Optional custom HTTPS landing page only — never tel:/mailto:.
            if (!raw) return null;
            return /^https?:\/\//i.test(raw) ? raw : null;
        }
        case 'stripe':
            return /^https?:\/\//i.test(raw) ? raw : null;
        default:
            return null;
    }
}

/**
 * Methods whose native apps mishandle amount-bearing universal links.
 * Route these through /api/pay/redirect so iOS/Android open the web checkout
 * (with amount) instead of a bare profile / home screen.
 */
export function paymentMethodNeedsBrowserHandoff(key: PaymentMethodKey): boolean {
    return key === 'paypal' || key === 'cashApp';
}

/** Href used by the Pay button (may be a same-origin redirect wrapper). */
export function paymentClickHref(key: PaymentMethodKey, externalHref: string): string {
    if (!paymentMethodNeedsBrowserHandoff(key)) return externalHref;
    if (!isAllowedPaymentRedirectUrl(externalHref)) return externalHref;
    return `/api/pay/redirect?u=${encodeURIComponent(externalHref)}`;
}

/** Methods without tap-to-pay deep links; show instructional copy instead. */
export function paymentMethodUsesManualDetails(key: PaymentMethodKey): boolean {
    return key === 'check' || key === 'cash' || key === 'applePay' || key === 'zelle';
}
