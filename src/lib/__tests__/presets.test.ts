import { describe, it, expect } from 'vitest';
import {
    applyPresetLineItems,
    buildPresetFromDocument,
    normalizePreset,
    normalizePresetsFile,
    presetMatchesDocumentType,
} from '@/lib/preset-utils';
import type { DocumentPreset } from '@/lib/types';

function samplePreset(overrides: Partial<DocumentPreset> = {}): DocumentPreset {
    return {
        id: 'preset-1',
        name: 'Weekly lawn',
        documentTypes: ['invoice'],
        title: 'Lawn service',
        notes: 'Mow and trim',
        lineItems: [
            {
                id: 'line-a',
                description: 'Lawn mowing',
                details: 'Weekly',
                quantity: 1,
                unitPrice: 40,
                total: 40,
            },
            {
                id: 'line-b',
                description: 'Trimming',
                quantity: 1,
                unitPrice: 20,
                total: 20,
            },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('normalizePreset', () => {
    it('returns null without a name', () => {
        expect(normalizePreset({ lineItems: [] })).toBeNull();
    });

    it('normalizes line totals and filters invalid document types', () => {
        const preset = normalizePreset({
            name: '  Mow  ',
            documentTypes: ['invoice', 'lead', 'nope'],
            lineItems: [
                { description: 'Cut', quantity: 2, unitPrice: 15, discountPercent: 10 },
            ],
        });
        expect(preset).not.toBeNull();
        expect(preset!.name).toBe('Mow');
        expect(preset!.documentTypes).toEqual(['invoice']);
        expect(preset!.lineItems).toHaveLength(1);
        expect(preset!.lineItems[0].total).toBeCloseTo(27);
    });
});

describe('normalizePresetsFile', () => {
    it('accepts { presets: [] } and bare arrays', () => {
        expect(normalizePresetsFile({ presets: [samplePreset()] })).toHaveLength(1);
        expect(normalizePresetsFile([samplePreset({ id: 'p2', name: 'B' })])).toHaveLength(1);
        expect(normalizePresetsFile(null)).toEqual([]);
    });

    it('dedupes by id and sorts by name', () => {
        const result = normalizePresetsFile({
            presets: [
                samplePreset({ id: '1', name: 'Zebra' }),
                samplePreset({ id: '1', name: 'Duplicate' }),
                samplePreset({ id: '2', name: 'Alpha' }),
            ],
        });
        expect(result.map((p) => p.id)).toEqual(['2', '1']);
        expect(result[0].name).toBe('Alpha');
    });
});

describe('presetMatchesDocumentType', () => {
    it('matches all types when documentTypes is empty', () => {
        const preset = samplePreset({ documentTypes: [] });
        expect(presetMatchesDocumentType(preset, 'quote')).toBe(true);
        expect(presetMatchesDocumentType(preset, 'invoice')).toBe(true);
    });

    it('matches only listed types', () => {
        const preset = samplePreset({ documentTypes: ['invoice', 'receipt'] });
        expect(presetMatchesDocumentType(preset, 'invoice')).toBe(true);
        expect(presetMatchesDocumentType(preset, 'estimate')).toBe(false);
    });
});

describe('applyPresetLineItems', () => {
    it('clones line items with fresh ids', () => {
        const preset = samplePreset();
        const applied = applyPresetLineItems(preset);
        expect(applied).toHaveLength(2);
        expect(applied[0].description).toBe('Lawn mowing');
        expect(applied[0].id).not.toBe('line-a');
        expect(applied[1].id).not.toBe('line-b');
        expect(applied[0].id).not.toBe(applied[1].id);
        expect(applied[0].unitPrice).toBe(40);
    });

    it('returns a default service line when preset has no items', () => {
        const applied = applyPresetLineItems(samplePreset({ lineItems: [] }));
        expect(applied).toHaveLength(1);
        expect(applied[0].description).toBe('Service');
    });
});

describe('buildPresetFromDocument', () => {
    it('copies lines/notes/title and scopes to the document type', () => {
        const input = buildPresetFromDocument(
            {
                type: 'invoice',
                title: 'Weekly visit',
                notes: 'Front and back',
                lineItems: [
                    {
                        id: 'old',
                        description: 'Mow',
                        quantity: 1,
                        unitPrice: 45,
                        total: 45,
                    },
                ],
            },
            ' Lawn preset ',
        );
        expect(input.name).toBe('Lawn preset');
        expect(input.documentTypes).toEqual(['invoice']);
        expect(input.title).toBe('Weekly visit');
        expect(input.notes).toBe('Front and back');
        expect(input.lineItems[0].id).not.toBe('old');
        expect(input.lineItems[0].description).toBe('Mow');
    });
});
