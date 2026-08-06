import type { PaymentKind } from './types';
import { toMoneyAmount } from './payment-links';
import { validateRecordPayment } from './document-save';

export type StripeCheckoutMode = 'full' | 'amount' | 'percent' | 'split';

export interface StripeCheckoutAmountInput {
    mode: StripeCheckoutMode;
    /** Invoice grand total. */
    invoiceTotal: number;
    /** Remaining balance due. */
    balanceDue: number;
    /** Dollar amount when mode === 'amount'. */
    amount?: number;
    /** Percent of invoice total when mode === 'percent' (e.g. 50). */
    percent?: number;
    /** Equal installment count when mode === 'split' (total / N). */
    splitCount?: number;
}

export interface StripeCheckoutAmountResult {
    amount: number;
    kind: PaymentKind;
    error?: string;
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Infer payment kind from how much of the invoice this charge covers. */
export function inferStripePaymentKind(amount: number, balanceDue: number, paidAmount: number): PaymentKind {
    const coversBalance = amount >= balanceDue - 0.001;
    if (coversBalance) return 'final';
    if (paidAmount <= 0.001) return 'down_payment';
    return 'partial';
}

/**
 * Resolve the Checkout charge amount from full / dollar / percent / equal-split modes.
 * Percent and split are based on invoice total (e.g. 50% down, or total / 3 payments),
 * then capped at the remaining balance due.
 */
export function resolveStripeCheckoutAmount(input: StripeCheckoutAmountInput): StripeCheckoutAmountResult {
    const balanceDue = roundMoney(Math.max(0, Number(input.balanceDue) || 0));
    const invoiceTotal = roundMoney(Math.max(0, Number(input.invoiceTotal) || 0));
    const paidAmount = roundMoney(Math.max(0, invoiceTotal - balanceDue));

    if (balanceDue <= 0) {
        return { amount: 0, kind: 'final', error: 'This invoice is already paid.' };
    }

    let amount = 0;
    switch (input.mode) {
        case 'full':
            amount = balanceDue;
            break;
        case 'amount': {
            amount = roundMoney(Number(input.amount));
            break;
        }
        case 'percent': {
            const percent = Number(input.percent);
            if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
                return { amount: 0, kind: 'partial', error: 'Enter a percentage between 0 and 100.' };
            }
            amount = roundMoney(invoiceTotal * (percent / 100));
            break;
        }
        case 'split': {
            const n = Math.floor(Number(input.splitCount));
            if (!Number.isFinite(n) || n < 2 || n > 24) {
                return { amount: 0, kind: 'partial', error: 'Split into between 2 and 24 equal payments.' };
            }
            amount = roundMoney(invoiceTotal / n);
            break;
        }
        default:
            return { amount: 0, kind: 'partial', error: 'Invalid payment mode.' };
    }

    // Percent / equal-split are derived from invoice total, so cap at remaining balance.
    // Explicit dollar amounts must not silently exceed the balance — validate instead.
    if (input.mode === 'percent' || input.mode === 'split') {
        amount = roundMoney(Math.min(amount, balanceDue));
    }

    const validationError = validateRecordPayment(amount, balanceDue);
    if (validationError) {
        return { amount: 0, kind: 'partial', error: validationError };
    }

    return {
        amount,
        kind: inferStripePaymentKind(amount, balanceDue, paidAmount),
    };
}

/** Stripe unit_amount is integer cents. */
export function toStripeUnitAmount(dollars: number): number {
    return Math.round(Number(toMoneyAmount(dollars)) * 100);
}

export function parseStripeCheckoutMode(raw: unknown): StripeCheckoutMode | null {
    if (raw === 'full' || raw === 'amount' || raw === 'percent' || raw === 'split') return raw;
    return null;
}
