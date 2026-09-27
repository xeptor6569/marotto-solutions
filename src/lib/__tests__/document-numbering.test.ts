import { describe, expect, it } from 'vitest';
import {
    buildDocumentId,
    DEFAULT_NUMBERING,
    resolveNumbering,
    sanitizePrefix,
    sanitizeStartNumber,
} from '@/lib/document-numbering';
import { mergeAppConfig } from '@/lib/config';

describe('document numbering', () => {
    it('builds ids with default prefixes and 4-digit padding', () => {
        expect(buildDocumentId('invoice', 7)).toBe('INV-0007');
        expect(buildDocumentId('receipt', 12345)).toBe('RCT-12345');
        expect(buildDocumentId('lead', 3)).toBe('LEAD-0003');
    });

    it('honors configured prefixes and padding', () => {
        const numbering = resolveNumbering({ prefixes: { invoice: 'acme-inv' }, padding: 5 });
        expect(numbering.prefixes.invoice).toBe('ACMEINV');
        expect(buildDocumentId('invoice', 42, numbering)).toBe('ACMEINV-00042');
        // Unconfigured types keep their defaults.
        expect(buildDocumentId('quote', 1, numbering)).toBe('QTE-00001');
    });

    it('sanitizes user input with safe fallbacks', () => {
        expect(sanitizePrefix('  in v!  ', 'INV')).toBe('INV');
        expect(sanitizePrefix('', 'INV')).toBe('INV');
        expect(sanitizePrefix('!!!', 'INV')).toBe('INV');
        expect(sanitizeStartNumber('250', 1)).toBe(250);
        expect(sanitizeStartNumber('0', 1)).toBe(1);
        expect(sanitizeStartNumber('abc', 1)).toBe(1);
        expect(resolveNumbering({ padding: 99 }).padding).toBe(8);
        expect(resolveNumbering(undefined)).toEqual(DEFAULT_NUMBERING);
    });

    it('fresh installs start at 1 while pre-white-label installs keep the legacy 200 baseline', () => {
        const fresh = mergeAppConfig(null);
        expect(fresh.numbering?.startNumbers?.invoice).toBe(1);

        const legacy = mergeAppConfig({ webdavUrl: '', webdavUsername: '' });
        expect(legacy.numbering?.startNumbers?.invoice).toBe(200);
        expect(legacy.numbering?.prefixes?.invoice).toBe('INV');

        const configured = mergeAppConfig({ business: { name: 'Acme' }, numbering: { prefixes: { invoice: 'ACME' } } });
        expect(configured.numbering?.prefixes?.invoice).toBe('ACME');
        expect(configured.numbering?.prefixes?.quote).toBe('QTE');
        expect(configured.numbering?.startNumbers?.invoice).toBe(1);
    });
});
