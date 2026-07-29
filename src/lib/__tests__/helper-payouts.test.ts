import { describe, it, expect } from 'vitest';
import { formatPayoutPaidAt, sumPayoutAmounts } from '@/lib/helper-payouts';

describe('sumPayoutAmounts', () => {
    it('sums and rounds to cents', () => {
        expect(sumPayoutAmounts([
            { amount: 40.1 },
            { amount: 19.2 },
            { amount: 0.7 },
        ])).toBe(60);
    });

    it('returns 0 for an empty list', () => {
        expect(sumPayoutAmounts([])).toBe(0);
    });
});

describe('formatPayoutPaidAt', () => {
    it('formats a valid date', () => {
        expect(formatPayoutPaidAt(new Date('2026-07-29T12:00:00.000Z'))).toMatch(/2026|7/);
    });

    it('returns an em dash for invalid input', () => {
        expect(formatPayoutPaidAt('not-a-date')).toBe('—');
    });
});
