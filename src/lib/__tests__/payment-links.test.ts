import { describe, expect, it } from 'vitest';
import {
    normalizeHandle,
    normalizePhoneDigits,
    paymentLinkForMethod,
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

    it('strips leading @ from handles', () => {
        expect(normalizeHandle('@@marotto')).toBe('marotto');
    });
});

describe('paymentLinkForMethod', () => {
    it('builds paypal.me links and preserves https urls', () => {
        expect(paymentLinkForMethod('paypal', method({ value: 'marotto' }), 100, 'INV-1')).toBe(
            'https://www.paypal.com/paypalme/marotto/100.00',
        );
        expect(
            paymentLinkForMethod('paypal', method({ value: 'https://paypal.me/x' }), 10, 'INV-1'),
        ).toBe('https://paypal.me/x');
    });

    it('builds venmo and cash app deep links', () => {
        expect(paymentLinkForMethod('venmo', method({ value: '@cam' }), 25.5, 'INV-9')).toBe(
            'https://venmo.com/cam?txn=pay&amount=25.50&note=Invoice%20INV-9',
        );
        expect(paymentLinkForMethod('cashApp', method({ value: '$cam' }), 10, 'INV-1')).toBe(
            'https://cash.app/$cam',
        );
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

describe('paymentMethodUsesManualDetails', () => {
    it('includes zelle with other non-deep-link methods', () => {
        expect(paymentMethodUsesManualDetails('zelle')).toBe(true);
        expect(paymentMethodUsesManualDetails('cash')).toBe(true);
        expect(paymentMethodUsesManualDetails('venmo')).toBe(false);
    });
});
