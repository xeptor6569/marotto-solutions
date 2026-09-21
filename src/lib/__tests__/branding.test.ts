import { describe, expect, it } from 'vitest';
import {
    buildServiceLabelMap,
    FALLBACK_BUSINESS_NAME,
    resolveBusiness,
    resolveLetterhead,
    resolvePublicSite,
} from '@/lib/branding';
import { resolveTheme } from '@/lib/theme-presets';

describe('resolveBusiness', () => {
    it('falls back to a neutral name when unconfigured', () => {
        const business = resolveBusiness(undefined);
        expect(business.name).toBe(FALLBACK_BUSINESS_NAME);
        expect(business.isConfigured).toBe(false);
        expect(business.phoneHref).toBeNull();
    });

    it('derives tel: href from E.164 first, then display phone', () => {
        expect(resolveBusiness({ name: 'A', phoneE164: '+15705550100' }).phoneHref).toBe('tel:+15705550100');
        expect(resolveBusiness({ name: 'A', phoneDisplay: '(570) 555-0100' }).phoneHref).toBe('tel:5705550100');
    });

    it('legalName falls back to name', () => {
        expect(resolveBusiness({ name: 'Acme LLC' }).legalName).toBe('Acme LLC');
        expect(resolveBusiness({ name: 'Acme', legalName: 'Acme Holdings LLC' }).legalName).toBe('Acme Holdings LLC');
    });
});

describe('resolveLetterhead', () => {
    it('uses explicit letterhead lines when set', () => {
        const business = resolveBusiness({ name: 'Acme Plumbing' });
        const letterhead = resolveLetterhead({ letterheadLine1: 'ACME', letterheadLine2: 'PLUMBING CO' }, business);
        expect(letterhead).toEqual({ line1: 'ACME', line2: 'PLUMBING CO' });
    });

    it('derives two lines from a multi-word business name', () => {
        const business = resolveBusiness({ name: 'Acme Plumbing Co' });
        const letterhead = resolveLetterhead(undefined, business);
        expect(letterhead).toEqual({ line1: 'Acme', line2: 'Plumbing Co' });
    });

    it('single-word names produce one line', () => {
        const business = resolveBusiness({ name: 'Acme' });
        expect(resolveLetterhead(undefined, business)).toEqual({ line1: 'Acme', line2: '' });
    });
});

describe('resolveTheme', () => {
    it('resolves a known preset', () => {
        const theme = resolveTheme({ themePreset: 'ocean-teal' });
        expect(theme.accentColor).toBe('teal');
        expect(theme.grayColor).toBe('sage');
    });

    it('falls back to the default preset when unset', () => {
        const theme = resolveTheme(undefined);
        expect(theme.presetId).toBe('classic-indigo');
        expect(theme.accentColor).toBe('indigo');
    });

    it('custom preset honors raw values with safe fallbacks', () => {
        const theme = resolveTheme({
            themePreset: 'custom',
            accentColor: 'crimson',
            grayColor: 'mauve',
            radius: 'full',
        });
        expect(theme).toMatchObject({ accentColor: 'crimson', grayColor: 'mauve', radius: 'full' });
        const invalid = resolveTheme({ themePreset: 'custom', accentColor: 'not-a-color' });
        expect(invalid.accentColor).toBe('indigo');
    });
});

describe('resolvePublicSite', () => {
    it('hero falls back to tagline, then name', () => {
        const business = resolveBusiness({ name: 'Acme', tagline: 'We fix things' });
        expect(resolvePublicSite(undefined, business).heroHeading).toBe('We fix things');
        const noTagline = resolveBusiness({ name: 'Acme' });
        expect(resolvePublicSite(undefined, noTagline).heroHeading).toBe('Acme');
    });

    it('builds a quote-form label map with an Other fallback', () => {
        const business = resolveBusiness({ name: 'Acme' });
        const publicSite = resolvePublicSite({
            enabled: true,
            services: [
                {
                    slug: 'plumbing',
                    formValue: 'plumbing',
                    title: 'Plumbing services',
                    shortTitle: 'Plumbing',
                    description: '',
                    summary: '',
                    highlights: [],
                    idealFor: [],
                },
            ],
        }, business);
        expect(buildServiceLabelMap(publicSite)).toEqual({ plumbing: 'Plumbing', other: 'Other' });
    });
});
