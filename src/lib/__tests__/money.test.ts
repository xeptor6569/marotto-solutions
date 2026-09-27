import { describe, expect, it } from 'vitest';
import {
    currencySymbol,
    formatMoney,
    isValidCurrencyCode,
    isValidLocale,
    resolveMoneyFormat,
    toMinorUnits,
} from '@/lib/money';

describe('formatMoney', () => {
    it('formats USD by default', () => {
        expect(formatMoney(1234.5)).toBe('$1,234.50');
        expect(formatMoney(0)).toBe('$0.00');
    });

    it('honors other currencies and locales', () => {
        expect(formatMoney(1234.5, { currency: 'GBP', locale: 'en-GB' })).toBe('£1,234.50');
        // de-DE uses a non-breaking space before the symbol.
        expect(formatMoney(1234.5, { currency: 'EUR', locale: 'de-DE' }).replace(/\u00a0/g, ' ')).toBe('1.234,50 €');
        expect(formatMoney(1500, { currency: 'JPY', locale: 'ja-JP' })).toBe('￥1,500');
    });

    it('treats non-finite input as zero', () => {
        expect(formatMoney(Number.NaN)).toBe('$0.00');
    });
});

describe('currencySymbol', () => {
    it('extracts the bare symbol', () => {
        expect(currencySymbol()).toBe('$');
        expect(currencySymbol({ currency: 'EUR', locale: 'en-IE' })).toBe('€');
    });
});

describe('resolveMoneyFormat', () => {
    it('falls back to USD/en-US for missing or invalid values', () => {
        expect(resolveMoneyFormat(undefined)).toEqual({ currency: 'USD', locale: 'en-US' });
        expect(resolveMoneyFormat({ currency: 'nope', locale: '???' })).toEqual({ currency: 'USD', locale: 'en-US' });
    });

    it('normalizes a valid code to upper case', () => {
        expect(resolveMoneyFormat({ currency: 'cad', locale: 'en-CA' })).toEqual({ currency: 'CAD', locale: 'en-CA' });
    });
});

describe('validation and minor units', () => {
    it('validates currency codes and locales', () => {
        expect(isValidCurrencyCode('EUR')).toBe(true);
        expect(isValidCurrencyCode('EU')).toBe(false);
        expect(isValidLocale('en-GB')).toBe(true);
        expect(isValidLocale('')).toBe(false);
    });

    it('converts to minor units per currency', () => {
        expect(toMinorUnits(12.34, 'USD')).toBe(1234);
        expect(toMinorUnits(1500, 'JPY')).toBe(1500);
    });
});
