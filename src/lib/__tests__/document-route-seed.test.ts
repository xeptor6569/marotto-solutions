import { describe, expect, it } from 'vitest';
import {
    buildDocumentInitialFromSeed,
    parseDocumentRouteSeed,
} from '@/lib/document-route-seed';

describe('parseDocumentRouteSeed', () => {
    it('extracts jobId and clientId', () => {
        const result = parseDocumentRouteSeed({
            jobId: 'job-1',
            clientId: 'client-1',
            redirectTo: '/admin/jobs/job-1',
        });
        expect(result.seed).toEqual({ jobId: 'job-1', clientId: 'client-1' });
        expect(result.redirectTo).toBe('/admin/jobs/job-1');
    });

    it('rejects non-admin redirects', () => {
        expect(parseDocumentRouteSeed({ redirectTo: 'https://evil.com' }).redirectTo).toBeUndefined();
        expect(parseDocumentRouteSeed({ redirectTo: '//evil.com' }).redirectTo).toBeUndefined();
        expect(parseDocumentRouteSeed({ redirectTo: '/dashboard' }).redirectTo).toBeUndefined();
    });

    it('handles empty params', () => {
        expect(parseDocumentRouteSeed(undefined)).toEqual({});
        expect(parseDocumentRouteSeed({})).toEqual({});
    });
});

describe('buildDocumentInitialFromSeed', () => {
    it('builds partial document data', () => {
        expect(buildDocumentInitialFromSeed({ jobId: 'j1', clientId: 'c1' })).toEqual({
            jobId: 'j1',
            customer: { name: '', clientId: 'c1', jobId: 'j1' },
        });
    });

    it('returns undefined without seed fields', () => {
        expect(buildDocumentInitialFromSeed(undefined)).toBeUndefined();
        expect(buildDocumentInitialFromSeed({})).toBeUndefined();
    });
});
