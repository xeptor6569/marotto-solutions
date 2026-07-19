import { describe, it, expect } from 'vitest';
import {
    aggregateJobEstimatedHours,
    formatHours,
    parseEstimatedHours,
} from '@/lib/job-estimated-hours';
import type { DocumentData } from '@/lib/types';

function doc(
    partial: Partial<DocumentData> & Pick<DocumentData, 'id' | 'type'>,
): DocumentData {
    return {
        number: 1,
        date: '2026-07-19',
        customer: { id: 'c1', name: 'Pat' },
        lineItems: [],
        subtotal: 0,
        total: 0,
        status: 'sent',
        tags: [],
        createdAt: '2026-07-19T00:00:00.000Z',
        updatedAt: '2026-07-19T00:00:00.000Z',
        ...partial,
    };
}

describe('aggregateJobEstimatedHours', () => {
    it('sums estimates and quotes with hours', () => {
        const summary = aggregateJobEstimatedHours(
            [doc({ id: 'EST-1', type: 'estimate', estimatedHours: 4 })],
            [doc({ id: 'QTE-1', type: 'quote', estimatedHours: 6 })],
        );
        expect(summary.totalHours).toBe(10);
        expect(summary.contributions).toHaveLength(2);
    });

    it('excludes estimates superseded by a converted quote', () => {
        const summary = aggregateJobEstimatedHours(
            [doc({ id: 'EST-1', type: 'estimate', estimatedHours: 8 })],
            [doc({
                id: 'QTE-1',
                type: 'quote',
                estimatedHours: 10,
                tags: ['converted', 'source:EST-1'],
            })],
        );
        expect(summary.totalHours).toBe(10);
        expect(summary.contributions.map((c) => c.documentId)).toEqual(['QTE-1']);
    });

    it('ignores void docs and missing/zero hours', () => {
        const summary = aggregateJobEstimatedHours(
            [
                doc({ id: 'EST-1', type: 'estimate', estimatedHours: 5, status: 'void' }),
                doc({ id: 'EST-2', type: 'estimate', estimatedHours: 0 }),
            ],
            [doc({ id: 'QTE-1', type: 'quote' })],
        );
        expect(summary.totalHours).toBe(0);
        expect(summary.contributions).toHaveLength(0);
    });
});

describe('parseEstimatedHours / formatHours', () => {
    it('parses valid hours', () => {
        expect(parseEstimatedHours('2.5')).toBe(2.5);
        expect(parseEstimatedHours('')).toBeUndefined();
        expect(parseEstimatedHours('-1')).toBeUndefined();
    });

    it('formats hours labels', () => {
        expect(formatHours(1)).toBe('1 hr');
        expect(formatHours(2.5)).toBe('2.5 hrs');
    });
});
