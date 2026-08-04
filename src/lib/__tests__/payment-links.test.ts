import { describe, expect, it } from 'vitest';
import {
    extractCashTag,
    extractPaypalMeUser,
    isAllowedPaymentRedirectUrl,
    normalizeHandle,
    normalizePhoneDigits,
    paymentClickHref,
    paymentLinkForMethod,
    paymentMethodNeedsBrowserHandoff,
    paymentMethodUsesManualDetails,
    toMoneyAmount,
} from '../payment-links';
import type { PaymentMethodEntry } from '../types';

function method(partial: Partial<PaymentMethodEntry> = {}): PaymentMethodEntry {
    return {
        enabled: true,
        label: 'Test',
        value: '',
        ...partial,
    };
}

describe('toMoneyAmount', () => {
    it('formats finite amounts to two decimals', () => {
        expect(toMoneyAmount(12.5)).toBe('12.50');
        expect(toMoneyAmount(0)).toBe('0.00');
    });

    it('clamps non-finite and negative amounts', () => {
        expect(toMoneyAmount(Number.NaN)).toBe('0.00');
        expect(toMoneyAmount(-5)).toBe('0.00');
    });
});

describe('normalize helpers', () => {
    it('strips non-digits from phone values', () => {
        expect(normalizePhoneDigits('(570) 332-9262')).toBe('5703329262');
    });

    it('strips leading @ and $ from handles', () => {
        expect(normalizeHandle('@@marotto')).toBe('marotto');
        expect(normalizeHandle('$cam')).toBe('cam');
    });
});

describe('extractPaypalMeUser', () => {
    it('accepts handles and paypal.me / paypal.com URLs', () => {
        expect(extractPaypalMeUser('marotto')).toBe('marotto');
        expect(extractPaypalMeUser('https://paypal.me/marotto')).toBe('marotto');
        expect(extractPaypalMeUser('https://www.paypal.com/paypalme/marotto/50.00')).toBe('marotto');
        expect(extractPaypalMeUser('paypal.me/marotto/25USD')).toBe('marotto');
    });
});

describe('extractCashTag', () => {
    it('accepts cashtags and cash.app URLs', () => {
        expect(extractCashTag('cam')).toBe('cam');
        expect(extractCashTag('$cam')).toBe('cam');
        expect(extractCashTag('https://cash.app/$cam/12.50')).toBe('cam');
        expect(extractCashTag('https://cash.app/qr/$cam/10')).toBe('cam');
    });
});

describe('paymentLinkForMethod', () => {
    it('builds paypal.me links with amount, including when a full URL is saved', () => {
        expect(paymentLinkForMethod('paypal', method({ value: 'marotto' }), 100, 'INV-1')).toBe(
            'https://paypal.me/marotto/100.00',
        );
        expect(
            paymentLinkForMethod('paypal', method({ value: 'https://paypal.me/x' }), 10.5, 'INV-1'),
        ).toBe('https://paypal.me/x/10.50');
        expect(
            paymentLinkForMethod(
                'paypal',
                method({ value: 'https://www.paypal.com/paypalme/x/999' }),
                42,
                'INV-1',
            ),
        ).toBe('https://paypal.me/x/42.00');
    });

    it('builds venmo and cash app deep links with amount', () => {
        expect(paymentLinkForMethod('venmo', method({ value: '@cam' }), 25.5, 'INV-9')).toBe(
            'https://venmo.com/cam?txn=pay&amount=25.50&note=Invoice%20INV-9',
        );
        expect(paymentLinkForMethod('cashApp', method({ value: 'cam' }), 10, 'INV-1')).toBe(
            'https://cash.app/$cam/10.00',
        );
        expect(paymentLinkForMethod('cashApp', method({ value: '$cam' }), 12.5, 'INV-1')).toBe(
            'https://cash.app/$cam/12.50',
        );
        expect(
            paymentLinkForMethod('cashApp', method({ value: 'https://cash.app/$cam' }), 7, 'INV-1'),
        ).toBe('https://cash.app/$cam/7.00');
    });

    it('does not open the dialer or mail client for Zelle phone/email', () => {
        expect(paymentLinkForMethod('zelle', method({ value: '5703329262' }), 50, 'INV-1')).toBeNull();
        expect(paymentLinkForMethod('zelle', method({ value: '(570) 332-9262' }), 50, 'INV-1')).toBeNull();
        expect(paymentLinkForMethod('zelle', method({ value: 'pay@example.com' }), 50, 'INV-1')).toBeNull();
    });

    it('allows an optional https Zelle landing page', () => {
        expect(
            paymentLinkForMethod('zelle', method({ value: 'https://example.com/pay' }), 50, 'INV-1'),
        ).toBe('https://example.com/pay');
    });

    it('returns null for coming soon and unsupported methods', () => {
        expect(paymentLinkForMethod('stripe', method({ comingSoon: true, value: 'https://x' }), 1, 'a')).toBeNull();
        expect(paymentLinkForMethod('cash', method({ value: 'cash' }), 1, 'a')).toBeNull();
        expect(paymentLinkForMethod('stripe', method({ value: 'https://pay.stripe.com/x' }), 1, 'a')).toBe(
            'https://pay.stripe.com/x',
        );
    });
});

describe('paymentClickHref / browser handoff', () => {
    it('wraps PayPal and Cash App through the same-origin redirect', () => {
        expect(paymentMethodNeedsBrowserHandoff('paypal')).toBe(true);
        expect(paymentMethodNeedsBrowserHandoff('cashApp')).toBe(true);
        expect(paymentMethodNeedsBrowserHandoff('venmo')).toBe(false);

        expect(paymentClickHref('paypal', 'https://paypal.me/x/10.00')).toBe(
            `/api/pay/redirect?u=${encodeURIComponent('https://paypal.me/x/10.00')}`,
        );
        expect(paymentClickHref('cashApp', 'https://cash.app/$cam/12.50')).toBe(
            `/api/pay/redirect?u=${encodeURIComponent('https://cash.app/$cam/12.50')}`,
        );
        expect(paymentClickHref('venmo', 'https://venmo.com/cam?txn=pay&amount=1.00')).toBe(
            'https://venmo.com/cam?txn=pay&amount=1.00',
        );
    });

    it('allowlists payment hosts only', () => {
        expect(isAllowedPaymentRedirectUrl('https://paypal.me/x/1')).toBe(true);
        expect(isAllowedPaymentRedirectUrl('https://cash.app/$x/1')).toBe(true);
        expect(isAllowedPaymentRedirectUrl('https://evil.example/phish')).toBe(false);
        expect(isAllowedPaymentRedirectUrl('javascript:alert(1)')).toBe(false);
    });
});

describe('paymentMethodUsesManualDetails', () => {
    it('includes zelle with other non-deep-link methods', () => {
        expect(paymentMethodUsesManualDetails('zelle')).toBe(true);
        expect(paymentMethodUsesManualDetails('cash')).toBe(true);
        expect(paymentMethodUsesManualDetails('venmo')).toBe(false);
    });
});
