import { describe, it, expect } from 'vitest';
import { DEFAULT_DOCUMENT_FORM_MODE, parseDocumentFormMode } from '@/lib/document-form-mode';

describe('parseDocumentFormMode', () => {
    it('defaults to guided', () => {
        expect(DEFAULT_DOCUMENT_FORM_MODE).toBe('guided');
        expect(parseDocumentFormMode(undefined)).toBe('guided');
        expect(parseDocumentFormMode('')).toBe('guided');
        expect(parseDocumentFormMode('nope')).toBe('guided');
    });

    it('accepts full', () => {
        expect(parseDocumentFormMode('full')).toBe('full');
    });
});
