import { describe, expect, it } from 'vitest';
import {
    clientSearchHit,
    contractSearchHit,
    documentSearchHit,
    documentSmartFields,
    jobSearchHit,
    matchesSmartQuery,
    rankAdminSearchHits,
    scoreSmartQuery,
    type SmartField,
} from '@/lib/smart-search';
import type { DocumentData } from '@/lib/types';

function doc(overrides: Partial<DocumentData> = {}): DocumentData {
    return {
        id: 'INV-0001',
        number: 1,
        type: 'invoice',
        date: '2026-06-01',
        customer: { id: 'c1', name: 'Dana', email: 'dana@example.com', phone: '(555) 123-4567', address: '12 Oak St' },
        lineItems: [],
        subtotal: 100,
        total: 100,
        status: 'sent',
        tags: [],
        createdAt: '2026-06-01',
        updatedAt: '2026-06-01',
        ...overrides,
    };
}

describe('matchesSmartQuery', () => {
    const fields: SmartField[] = [
        { value: 'José García' },
        { value: 'Kitchen remodel' },
        { value: '(555) 123-4567', kind: 'phone' },
        { value: 'invoice' },
    ];

    it('treats an empty query as matching everything', () => {
        expect(matchesSmartQuery('   ', fields)).toBe(true);
        expect(scoreSmartQuery('   ', fields)).toBe(0);
    });

    it('ignores diacritics and requires every word', () => {
        expect(matchesSmartQuery('jose garcia', fields)).toBe(true);
        expect(matchesSmartQuery('José kitchen', fields)).toBe(true);
        expect(matchesSmartQuery('jose missing', fields)).toBe(false);
    });

    it('matches a word prefix and a mid-word substring, and refuses short typos', () => {
        expect(matchesSmartQuery('kit', [{ value: 'Kitchen remodel' }])).toBe(true);
        expect(matchesSmartQuery('itch', [{ value: 'Kitchen remodel' }])).toBe(true);
        expect(matchesSmartQuery('inv', [{ value: 'invoice' }])).toBe(true);
        expect(matchesSmartQuery('inv', [{ value: 'inb' }])).toBe(false);
    });

    it('tolerates a one-edit typo on longer words, and two edits only at 8+ characters', () => {
        expect(matchesSmartQuery('kitchin', [{ value: 'kitchen' }])).toBe(true);
        expect(matchesSmartQuery('kitchan', [{ value: 'kitchen' }])).toBe(true);
        expect(matchesSmartQuery('kxthxn', [{ value: 'kitchen' }])).toBe(false);
        expect(matchesSmartQuery('kitchennn', [{ value: 'kitchen' }])).toBe(true);
        expect(matchesSmartQuery('kitchennnn', [{ value: 'kitchen' }])).toBe(false);
    });

    it('does not fuzzy-match digits, so a nearby invoice number stays put', () => {
        expect(matchesSmartQuery('1234', [{ value: '1235', kind: 'identity' }])).toBe(false);
        expect(matchesSmartQuery('1234', [{ value: '1234', kind: 'identity' }])).toBe(true);
    });

    it('matches phone digits across formatting, and only on phone fields', () => {
        expect(matchesSmartQuery('(555) 123-4567', [{ value: '5551234567', kind: 'phone' }])).toBe(true);
        expect(matchesSmartQuery('555.123.4567', fields)).toBe(true);
        expect(matchesSmartQuery('(555) 123-4567', [{ value: '5551234567' }])).toBe(false);
        expect(matchesSmartQuery('(555)', [{ value: 'call the client' }])).toBe(false);
    });
});

describe('scoreSmartQuery', () => {
    it('ranks an exact id or number above the same text mentioned elsewhere', () => {
        const exact = scoreSmartQuery('INV-0001', [
            { value: 'INV-0001', kind: 'identity' },
            { value: 'Sink' },
        ]);
        const mentioned = scoreSmartQuery('INV-0001', [
            { value: 'INV-0099', kind: 'identity' },
            { value: 'See INV-0001' },
        ]);
        const number = scoreSmartQuery('42', [
            { value: '42', kind: 'identity' },
            { value: 'Cabinet' },
        ]);
        const described = scoreSmartQuery('42', [
            { value: '7', kind: 'identity' },
            { value: '42 inch cabinet' },
        ]);
        expect(exact).toBeGreaterThan(mentioned);
        expect(mentioned).toBeGreaterThan(0);
        expect(number).toBeGreaterThan(described);
        expect(scoreSmartQuery('nope', [{ value: 'INV-0001', kind: 'identity' }])).toBe(0);
    });

    it('ranks a whole word above a prefix, a prefix above a substring, and a typo last', () => {
        const word = scoreSmartQuery('smith', [{ value: 'Smith' }]);
        const prefix = scoreSmartQuery('smi', [{ value: 'Smith' }]);
        const substring = scoreSmartQuery('mit', [{ value: 'Smith' }]);
        const phone = scoreSmartQuery('(555)', [{ value: '5551234567', kind: 'phone' }]);
        const typo = scoreSmartQuery('smyth', [{ value: 'Smith' }]);
        expect(word).toBeGreaterThan(prefix);
        expect(prefix).toBeGreaterThan(substring);
        expect(substring).toBeGreaterThan(phone);
        expect(phone).toBeGreaterThan(typo);
        expect(typo).toBeGreaterThan(0);
    });
});

describe('document and record hits', () => {
    it('searches line items, package lines, choice lines, and customer phone', () => {
        const invoice = doc({
            title: 'Hall bath',
            lineItems: [{ id: 'base', description: 'Demo', details: 'haul away', quantity: 1, unitPrice: 1, total: 1 }],
            packages: [{
                id: 'p',
                label: 'Gold package',
                lineItems: [{ id: 'q', description: 'Quartz counter', details: '2cm slab', quantity: 1, unitPrice: 1, total: 1 }],
            }],
            choiceGroups: [{
                id: 'g',
                label: 'Floor',
                choices: [{
                    id: 'c',
                    label: 'Wood',
                    lineItems: [{ id: 'o', description: 'Oak boards', quantity: 1, unitPrice: 1, total: 1 }],
                }],
            }],
        });
        const fields = documentSmartFields(invoice);
        expect(matchesSmartQuery('haul away', fields)).toBe(true);
        expect(matchesSmartQuery('quartz slab', fields)).toBe(true);
        expect(matchesSmartQuery('oak boards', fields)).toBe(true);
        expect(matchesSmartQuery('gold package', fields)).toBe(false);
        expect(matchesSmartQuery('5551234567', fields)).toBe(true);
        expect(matchesSmartQuery('oak st', fields)).toBe(true);

        const hit = documentSearchHit(invoice);
        expect(hit.kind).toBe('invoice');
        expect(hit.href).toBe('/admin/invoices/INV-0001');
        expect(hit.title).toBe('#1 — Hall bath');
        expect(hit.subtitle).toContain('Dana');
    });

    it('builds client, job, and contract links', () => {
        expect(clientSearchHit({
            id: 'client-1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            phone: '5551234567',
            address: null,
            notes: 'Prefers mornings',
            isProspect: true,
        })).toMatchObject({
            kind: 'client',
            href: '/admin/clients?client=client-1',
            title: 'Ada Lovelace',
            subtitle: 'Prospect · ada@example.com · 5551234567',
        });

        expect(jobSearchHit({
            id: 'job-1',
            name: 'Kitchen',
            description: 'North wall',
            status: 'active',
            clientName: 'Ada Lovelace',
        })).toMatchObject({
            href: '/admin/jobs/job-1',
            subtitle: 'Ada Lovelace · Active',
        });
        expect(matchesSmartQuery('ada wall', jobSearchHit({
            id: 'job-1',
            name: 'Kitchen',
            description: 'North wall',
            status: 'active',
            clientName: 'Ada Lovelace',
        }).fields)).toBe(true);

        const contract = contractSearchHit({
            id: 'ctr-1',
            number: 4,
            displayId: 'CTR-0004',
            title: 'Seasonal mowing',
            status: 'paused',
            customerName: 'Ada Lovelace',
            customerEmail: null,
            customerPhone: '555-010-2030',
            lines: [{ description: 'Weekly cut', details: 'bag clippings' }],
        });
        expect(contract.href).toBe('/admin/contracts/ctr-1');
        expect(contract.subtitle).toBe('CTR-0004 · Ada Lovelace · Paused');
        expect(matchesSmartQuery('bag clippings', contract.fields)).toBe(true);
        expect(scoreSmartQuery('CTR-0004', contract.fields)).toBeGreaterThan(scoreSmartQuery('mowing', contract.fields));
    });
});

describe('rankAdminSearchHits', () => {
    it('puts the exact number first and caps the list', () => {
        const exact = documentSearchHit(doc({ id: 'INV-0042', number: 42, title: 'Sink' }));
        const mentioned = documentSearchHit(doc({ id: 'INV-0007', number: 7, title: 'See INV-0042' }));
        const ranked = rankAdminSearchHits('INV-0042', [mentioned, exact]);
        expect(ranked.map((hit) => hit.id)).toEqual(['INV-0042', 'INV-0007']);

        const many = Array.from({ length: 25 }, (_, index) => ({
            kind: 'job' as const,
            id: String(index),
            href: `/admin/jobs/${index}`,
            title: `Item ${String(index).padStart(2, '0')}`,
            subtitle: '',
            fields: [{ value: 'alpha' }],
        }));
        const top = rankAdminSearchHits('alpha', many);
        expect(top).toHaveLength(20);
        expect(top[0].title).toBe('Item 00');
        expect(top[19].title).toBe('Item 19');
    });
});
