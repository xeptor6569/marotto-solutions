import type { PaymentMethodEntry, PaymentMethodKey } from './types';

export function normalizePhoneDigits(value?: string) {
    return (value || '').replace(/\D/g, '');
}

export function normalizeHandle(value?: string) {
    return (value || '').trim().replace(/^@+/, '');
}

export function toMoneyAmount(amount: number) {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    return safeAmount.toFixed(2);
}

/**
 * Build a tap-to-pay href for payment methods that support deep links.
 *
 * Zelle has no public universal payment URL — recipients must open their bank
 * app and enter the enrolled email/phone manually. Do not emit tel: or mailto:
 * links for Zelle (those open the dialer / mail client instead of paying).
 */
export function paymentLinkForMethod(
    key: PaymentMethodKey,
    method: PaymentMethodEntry,
    amount: number,
    invoiceId: string,
): string | null {
    if (method.comingSoon) return null;
    const raw = (method.value || '').trim();
    const encodedAmount = encodeURIComponent(toMoneyAmount(amount));
    const encodedNote = encodeURIComponent(`Invoice ${invoiceId}`);

    switch (key) {
        case 'paypal': {
            if (!raw) return null;
            if (/^https?:\/\//i.test(raw)) return raw;
            const paypalUser = normalizeHandle(raw);
            return paypalUser
                ? `https://www.paypal.com/paypalme/${encodeURIComponent(paypalUser)}/${encodedAmount}`
                : null;
        }
        case 'venmo': {
            const venmoUser = normalizeHandle(raw);
            return venmoUser
                ? `https://venmo.com/${encodeURIComponent(venmoUser)}?txn=pay&amount=${encodedAmount}&note=${encodedNote}`
                : null;
        }
        case 'cashApp': {
            const cashTag = normalizeHandle(raw);
            return cashTag
                ? `https://cash.app/$${encodeURIComponent(cashTag)}`
                : null;
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

/** Methods without tap-to-pay deep links; show instructional copy instead. */
export function paymentMethodUsesManualDetails(key: PaymentMethodKey): boolean {
    return key === 'check' || key === 'cash' || key === 'applePay' || key === 'zelle';
}
