import { describe, it, expect } from 'vitest';
import { buildConvertedDocument } from '@/lib/convert-document';
import type { DocumentData, LineItem } from '@/lib/types';

function line(partial: Partial<LineItem> & { total: number; description: string }): LineItem {
    return {
        id: partial.id || crypto.randomUUID(),
        description: partial.description,
        quantity: partial.quantity ?? 1,
        unitPrice: partial.unitPrice ?? partial.total,
        total: partial.total,
        ...(partial.pendingClientApproval ? { pendingClientApproval: true } : {}),
    };
}

function sourceEstimate(): DocumentData {
    return {
        id: 'EST-0001',
        number: 1,
        type: 'estimate',
        date: '2026-07-19',
        customer: { id: 'c1', name: 'Pat' },
        lineItems: [line({ description: 'Base', total: 1000 })],
        packages: [
            {
                id: 'pkg-a',
                label: 'Basic',
                lineItems: [line({ description: 'Basic approach', total: 500 })],
            },
            {
                id: 'pkg-b',
                label: 'Premium',
                lineItems: [line({ description: 'Premium approach', total: 1200 })],
            },
        ],
        choiceGroups: [
            {
                id: 'grp-1',
                label: 'Flooring',
                required: true,
                choices: [
                    {
                        id: 'ch-lam',
                        label: 'Laminate',
                        lineItems: [line({ description: 'Laminate', total: 200 })],
                    },
                    {
                        id: 'ch-hard',
                        label: 'Hardwood',
                        lineItems: [line({ description: 'Hardwood', total: 800 })],
                    },
                ],
            },
        ],
        optionSelection: {
            packageId: 'pkg-a',
            choices: { 'grp-1': 'ch-lam' },
            by: 'admin',
            at: '2026-07-19T00:00:00.000Z',
        },
        estimatedHours: 12.5,
        subtotal: 1700,
        total: 1700,
        status: 'sent',
        tags: [],
        createdAt: '2026-07-19T00:00:00.000Z',
        updatedAt: '2026-07-19T00:00:00.000Z',
    };
}

describe('buildConvertedDocument with options', () => {
    it('preserves packages and choice groups when converting estimate → quote', () => {
        const quote = buildConvertedDocument(sourceEstimate(), 'quote', 2);
        expect(quote.type).toBe('quote');
        expect(quote.packages).toHaveLength(2);
        expect(quote.choiceGroups).toHaveLength(1);
        expect(quote.lineItems.map((i) => i.description)).toEqual(['Base']);
        expect(quote.optionSelection?.choices).toBeTruthy();
        expect(quote.estimatedHours).toBe(12.5);
        // Selection remapped onto new ids by label
        const pkgId = quote.optionSelection?.packageId;
        expect(quote.packages?.some((p) => p.id === pkgId && p.label === 'Basic')).toBe(true);
    });

    it('flattens selected configuration when converting to invoice', () => {
        const invoice = buildConvertedDocument(sourceEstimate(), 'invoice', 3);
        expect(invoice.type).toBe('invoice');
        expect(invoice.packages).toBeUndefined();
        expect(invoice.choiceGroups).toBeUndefined();
        expect(invoice.optionSelection).toBeUndefined();
        expect(invoice.estimatedHours).toBeUndefined();
        expect(invoice.lineItems.map((i) => i.description).sort()).toEqual([
            'Base',
            'Basic approach',
            'Laminate',
        ].sort());
        expect(invoice.total).toBe(1700);
        expect(invoice.lineItems.every((i) => !i.pendingClientApproval)).toBe(true);
    });
});
