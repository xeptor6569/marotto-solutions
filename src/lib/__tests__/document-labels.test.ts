import { describe, it, expect } from 'vitest';
import {
    documentListLabel,
    documentListSubLabel,
    suggestDocumentTitle,
} from '@/lib/document-labels';

describe('documentListLabel', () => {
    it('prefers title over customer name', () => {
        expect(documentListLabel({
            number: 12,
            title: 'Weekly lawn mowing',
            customer: { id: '1', name: 'Pat Smith' },
        })).toBe('#12 — Weekly lawn mowing');
    });

    it('falls back to customer name when title is missing', () => {
        expect(documentListLabel({
            number: 3,
            customer: { id: '1', name: 'Pat Smith' },
        })).toBe('#3 — Pat Smith');
    });
});

describe('documentListSubLabel', () => {
    it('shows customer under a titled document', () => {
        expect(documentListSubLabel({
            title: 'Weekly lawn mowing',
            customer: { id: '1', name: 'Pat Smith' },
        })).toBe('Pat Smith');
    });

    it('returns undefined when there is no title (customer is already primary)', () => {
        expect(documentListSubLabel({
            customer: { id: '1', name: 'Pat Smith' },
        })).toBeUndefined();
    });
});

describe('suggestDocumentTitle', () => {
    it('uses the first meaningful line description', () => {
        expect(suggestDocumentTitle([
            { description: 'Lawn mowing' },
            { description: 'Trimming' },
        ])).toBe('Lawn mowing +1 more');
    });

    it('skips generic Service placeholder lines', () => {
        expect(suggestDocumentTitle([
            { description: 'Service' },
            { description: 'Hedge trimming' },
        ])).toBe('Hedge trimming');
    });

    it('falls back to the provided job name', () => {
        expect(suggestDocumentTitle([], 'Spring cleanup')).toBe('Spring cleanup');
    });
});
