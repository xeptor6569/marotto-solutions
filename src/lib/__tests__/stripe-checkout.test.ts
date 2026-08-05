import { describe, expect, it } from 'vitest';
import {
    inferStripePaymentKind,
    resolveStripeCheckoutAmount,
    toStripeUnitAmount,
} from '@/lib/stripe-checkout';

describe('resolveStripeCheckoutAmount', () => {
    it('defaults to full balance due', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'full',
            invoiceTotal: 1000,
            balanceDue: 750,
        });
        expect(result.error).toBeUndefined();
        expect(result.amount).toBe(750);
        expect(result.kind).toBe('final');
    });

    it('accepts an explicit dollar amount up to the balance', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'amount',
            invoiceTotal: 1000,
            balanceDue: 1000,
            amount: 250,
        });
        expect(result.error).toBeUndefined();
        expect(result.amount).toBe(250);
        expect(result.kind).toBe('down_payment');
    });

    it('rejects amounts above the balance due', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'amount',
            invoiceTotal: 1000,
            balanceDue: 200,
            amount: 250,
        });
        expect(result.error).toMatch(/cannot exceed/i);
        expect(result.amount).toBe(0);
    });

    it('computes percentage of invoice total (50% down)', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'percent',
            invoiceTotal: 1200,
            balanceDue: 1200,
            percent: 50,
        });
        expect(result.error).toBeUndefined();
        expect(result.amount).toBe(600);
        expect(result.kind).toBe('down_payment');
    });

    it('caps percentage payments at the remaining balance', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'percent',
            invoiceTotal: 1000,
            balanceDue: 300,
            percent: 50,
        });
        expect(result.error).toBeUndefined();
        expect(result.amount).toBe(300);
        expect(result.kind).toBe('final');
    });

    it('splits invoice total into N equal payments', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'split',
            invoiceTotal: 900,
            balanceDue: 900,
            splitCount: 3,
        });
        expect(result.error).toBeUndefined();
        expect(result.amount).toBe(300);
        expect(result.kind).toBe('down_payment');
    });

    it('rejects invalid split counts', () => {
        expect(
            resolveStripeCheckoutAmount({
                mode: 'split',
                invoiceTotal: 900,
                balanceDue: 900,
                splitCount: 1,
            }).error,
        ).toMatch(/2 and 24/i);
    });

    it('errors when the invoice is already paid', () => {
        const result = resolveStripeCheckoutAmount({
            mode: 'full',
            invoiceTotal: 500,
            balanceDue: 0,
        });
        expect(result.error).toMatch(/already paid/i);
    });
});

describe('inferStripePaymentKind', () => {
    it('marks covering the balance as final', () => {
        expect(inferStripePaymentKind(100, 100, 400)).toBe('final');
    });

    it('marks first partial as down payment', () => {
        expect(inferStripePaymentKind(250, 1000, 0)).toBe('down_payment');
    });

    it('marks later partials as partial', () => {
        expect(inferStripePaymentKind(250, 750, 250)).toBe('partial');
    });
});

describe('toStripeUnitAmount', () => {
    it('converts dollars to integer cents', () => {
        expect(toStripeUnitAmount(12.34)).toBe(1234);
        expect(toStripeUnitAmount(0.5)).toBe(50);
    });
});
