import { describe, expect, it } from 'vitest';
import { documentNextStep } from '@/lib/document-next-step';
import { createMoneyFormatter, DEFAULT_MONEY_FORMAT } from '@/lib/money';
import type { DocumentData } from '@/lib/types';

const money = createMoneyFormatter(DEFAULT_MONEY_FORMAT);
const now = new Date('2026-06-15T12:00:00Z');
const day = 86_400_000;

function doc(overrides: Partial<DocumentData>): DocumentData {
    return {
        id: 'INV-0001',
        number: 1,
        type: 'invoice',
        date: '2026-06-01T00:00:00Z',
        customer: { id: 'c', name: 'Dana' },
        lineItems: [],
        subtotal: 500,
        total: 500,
        status: 'sent',
        tags: [],
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
        ...overrides,
    };
}

describe('documentNextStep', () => {
    it('drafts nudge to send', () => {
        expect(documentNextStep(doc({ status: 'draft' }), money, now)).toMatchObject({ tone: 'info' });
    });

    it('overdue invoices say how late and how much', () => {
        const step = documentNextStep(doc({ dueDate: new Date(now.getTime() - 4 * day).toISOString() }), money, now);
        expect(step.tone).toBe('danger');
        expect(step.message).toContain('Overdue by 4 days');
        expect(step.message).toContain('$500.00');
    });

    it('part-paid and on-time invoices show what is left', () => {
        const step = documentNextStep(doc({ paidAmount: 200, balanceDue: 300, dueDate: new Date(now.getTime() + 3 * day).toISOString() }), money, now);
        expect(step).toMatchObject({ tone: 'warning' });
        expect(step.message).toContain('$300.00 left of $500.00, due in 3 days');
    });

    it('paid invoices mention the last payment date', () => {
        const step = documentNextStep(doc({
            status: 'paid',
            balanceDue: 0,
            payments: [
                { id: 'a', amount: 200, date: '2026-06-03', kind: 'partial' },
                { id: 'b', amount: 300, date: '2026-06-10', kind: 'final' },
            ],
        }), money, now);
        expect(step.tone).toBe('success');
        expect(step.message).toContain('Jun 10');
    });

    it('sent quotes warn after a week without a reply', () => {
        const step = documentNextStep(doc({ type: 'quote', updatedAt: new Date(now.getTime() - 9 * day).toISOString() }), money, now);
        expect(step.tone).toBe('warning');
        expect(step.message).toContain('9 days ago');
    });
});
