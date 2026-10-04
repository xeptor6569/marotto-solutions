import { describe, it, expect } from 'vitest';
import {
    choiceTotal,
    copiedLabel,
    documentDisplayTotal,
    documentHasOptions,
    duplicateChoice,
    duplicateChoiceGroup,
    duplicatePackage,
    isOptionSelectionComplete,
    packageTotal,
    resolveSelectedLineItems,
    sanitizeOptionSelection,
    setRecommendedPackage,
    startingFromTotal,
    stripOptionsForInvoice,
    withSingleRecommended,
} from '@/lib/document-options';
import type {
    DocumentChoiceGroup,
    DocumentData,
    DocumentPackage,
    LineItem,
} from '@/lib/types';

function line(partial: Partial<LineItem> & { total: number; description?: string }): LineItem {
    return {
        id: partial.id || crypto.randomUUID(),
        description: partial.description || 'Item',
        quantity: partial.quantity ?? 1,
        unitPrice: partial.unitPrice ?? partial.total,
        total: partial.total,
        ...(partial.pendingClientApproval ? { pendingClientApproval: true } : {}),
        ...(partial.discountPercent ? { discountPercent: partial.discountPercent } : {}),
    };
}

function baseDoc(overrides: Partial<DocumentData> = {}): Pick<
    DocumentData,
    'lineItems' | 'packages' | 'choiceGroups' | 'optionSelection'
> {
    return {
        lineItems: [line({ description: 'Base labor', total: 1000 })],
        ...overrides,
    };
}

const packages: DocumentPackage[] = [
    {
        id: 'pkg-basic',
        label: 'Option A — Basic',
        lineItems: [line({ description: 'Basic approach', total: 500 })],
    },
    {
        id: 'pkg-premium',
        label: 'Option B — Premium',
        recommended: true,
        lineItems: [line({ description: 'Premium approach', total: 1200 })],
    },
];

const choiceGroups: DocumentChoiceGroup[] = [
    {
        id: 'grp-floor',
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
];

describe('option authoring helpers', () => {
    it('numbers copy labels', () => {
        expect(copiedLabel('')).toBe('');
        expect(copiedLabel('Basic')).toBe('Basic (copy)');
        expect(copiedLabel('Basic (copy)')).toBe('Basic (copy 2)');
        expect(copiedLabel('Basic (copy 2)')).toBe('Basic (copy 3)');
    });

    it('duplicates a package with new ids and no recommended flag', () => {
        const copy = duplicatePackage(packages[1]);
        expect(copy.id).not.toBe(packages[1].id);
        expect(copy.label).toBe('Option B — Premium (copy)');
        expect(copy.recommended).toBeUndefined();
        expect(copy.lineItems[0].id).not.toBe(packages[1].lineItems[0].id);
        expect(copy.lineItems[0].description).toBe('Premium approach');
        expect(copy.lineItems[0].total).toBe(1200);
    });

    it('duplicates a choice and a group without renaming nested choices', () => {
        const choice = duplicateChoice(choiceGroups[0].choices[1]);
        expect(choice.label).toBe('Hardwood (copy)');
        expect(choice.id).not.toBe('ch-hard');
        expect(choice.lineItems[0].id).not.toBe(choiceGroups[0].choices[1].lineItems[0].id);

        const group = duplicateChoiceGroup(choiceGroups[0]);
        expect(group.id).not.toBe('grp-floor');
        expect(group.label).toBe('Flooring (copy)');
        expect(group.choices.map((entry) => entry.label)).toEqual(['Laminate', 'Hardwood']);
        expect(group.choices[0].id).not.toBe('ch-lam');
    });

    it('keeps a single recommended package', () => {
        const both = [
            { ...packages[0], recommended: true },
            { ...packages[1], recommended: true },
        ];
        const normalized = withSingleRecommended(both);
        expect(normalized[0].recommended).toBe(true);
        expect(normalized[1].recommended).toBeUndefined();

        const switched = setRecommendedPackage(normalized, 'pkg-premium', true);
        expect(switched[0].recommended).toBeUndefined();
        expect(switched[1].recommended).toBe(true);

        const cleared = setRecommendedPackage(switched, 'pkg-premium', false);
        expect(cleared.every((pkg) => pkg.recommended === undefined)).toBe(true);
    });
});

describe('packageTotal / choiceTotal', () => {
    it('sums package line items', () => {
        expect(packageTotal(packages[0])).toBe(500);
        expect(packageTotal(packages[1])).toBe(1200);
    });

    it('sums choice line items', () => {
        expect(choiceTotal(choiceGroups[0].choices[0])).toBe(200);
        expect(choiceTotal(choiceGroups[0].choices[1])).toBe(800);
    });
});

describe('startingFromTotal / selectedTotal', () => {
    it('uses cheapest package and cheapest required choice when incomplete', () => {
        const doc = baseDoc({ packages, choiceGroups });
        // 1000 base + 500 cheapest package + 200 cheapest flooring
        expect(startingFromTotal(doc)).toBe(1700);
        expect(documentDisplayTotal(doc)).toBe(1700);
    });

    it('uses selected package and choices when complete', () => {
        const doc = baseDoc({
            packages,
            choiceGroups,
            optionSelection: {
                packageId: 'pkg-premium',
                choices: { 'grp-floor': 'ch-hard' },
                by: 'admin',
                at: '2026-07-19T00:00:00.000Z',
            },
        });
        expect(documentDisplayTotal(doc)).toBe(3000);
        expect(isOptionSelectionComplete(doc)).toBe(true);
    });

    it('returns base-only total when no options', () => {
        const doc = baseDoc();
        expect(documentHasOptions(doc)).toBe(false);
        expect(documentDisplayTotal(doc)).toBe(1000);
        expect(isOptionSelectionComplete(doc)).toBe(true);
    });
});

describe('isOptionSelectionComplete', () => {
    it('is incomplete when packages exist but none selected', () => {
        expect(isOptionSelectionComplete(baseDoc({ packages }))).toBe(false);
    });

    it('is incomplete when required choice missing', () => {
        expect(
            isOptionSelectionComplete(
                baseDoc({
                    packages,
                    choiceGroups,
                    optionSelection: {
                        packageId: 'pkg-basic',
                        choices: {},
                        by: 'admin',
                        at: '2026-07-19T00:00:00.000Z',
                    },
                }),
            ),
        ).toBe(false);
    });

    it('allows optional groups to be unset', () => {
        const optionalGroups: DocumentChoiceGroup[] = [
            {
                ...choiceGroups[0],
                required: false,
            },
        ];
        expect(
            isOptionSelectionComplete(
                baseDoc({
                    packages,
                    choiceGroups: optionalGroups,
                    optionSelection: {
                        packageId: 'pkg-basic',
                        choices: {},
                        by: 'admin',
                        at: '2026-07-19T00:00:00.000Z',
                    },
                }),
            ),
        ).toBe(true);
    });
});

describe('resolveSelectedLineItems', () => {
    it('includes base + selected package + selected choice', () => {
        const items = resolveSelectedLineItems(
            baseDoc({
                packages,
                choiceGroups,
                optionSelection: {
                    packageId: 'pkg-basic',
                    choices: { 'grp-floor': 'ch-lam' },
                    by: 'admin',
                    at: '2026-07-19T00:00:00.000Z',
                },
            }),
        );
        expect(items.map((i) => i.description)).toEqual([
            'Base labor',
            'Basic approach',
            'Laminate',
        ]);
    });

    it('can regenerate ids for convert', () => {
        const baseId = 'keep-me';
        const items = resolveSelectedLineItems(
            baseDoc({
                lineItems: [line({ id: baseId, description: 'Base labor', total: 1000 })],
                packages,
                optionSelection: {
                    packageId: 'pkg-basic',
                    choices: {},
                    by: 'admin',
                    at: '2026-07-19T00:00:00.000Z',
                },
            }),
            { regenerateIds: true },
        );
        expect(items[0].id).not.toBe(baseId);
    });
});

describe('stripOptionsForInvoice', () => {
    it('drops pendingClientApproval and regenerates ids', () => {
        const source = [
            line({ id: 'a', description: 'Work', total: 100, pendingClientApproval: true }),
        ];
        const stripped = stripOptionsForInvoice(source);
        expect(stripped[0].pendingClientApproval).toBeUndefined();
        expect(stripped[0].id).not.toBe('a');
        expect(stripped[0].total).toBe(100);
    });
});

describe('sanitizeOptionSelection', () => {
    it('drops stale package and choice ids', () => {
        const cleaned = sanitizeOptionSelection({
            packages,
            choiceGroups,
            optionSelection: {
                packageId: 'gone',
                choices: { 'grp-floor': 'gone', other: 'x' },
                by: 'admin',
                at: '2026-07-19T00:00:00.000Z',
            },
        });
        expect(cleaned).toBeUndefined();
    });

    it('keeps valid selection', () => {
        const cleaned = sanitizeOptionSelection({
            packages,
            choiceGroups,
            optionSelection: {
                packageId: 'pkg-basic',
                choices: { 'grp-floor': 'ch-lam' },
                by: 'client',
                at: '2026-07-19T00:00:00.000Z',
            },
        });
        expect(cleaned).toEqual({
            packageId: 'pkg-basic',
            choices: { 'grp-floor': 'ch-lam' },
            by: 'client',
            at: '2026-07-19T00:00:00.000Z',
        });
    });
});
