import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateShareToken,
    buildSharePath,
    withDocumentShareToken,
    withContractShareToken,
} from '@/lib/share-token';

describe('generateShareToken', () => {
    it('returns a URL-safe base64url string of sufficient length', () => {
        const token = generateShareToken();
        expect(token.length).toBeGreaterThanOrEqual(40);
        expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('produces unique tokens', () => {
        const tokens = new Set(Array.from({ length: 50 }, () => generateShareToken()));
        expect(tokens.size).toBe(50);
    });
});

describe('buildSharePath', () => {
    it('builds a /d/{token} path and never a sequential document id path', () => {
        const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_';
        const path = buildSharePath(token);
        expect(path).toBe(`/d/${token}`);
        expect(path).not.toMatch(/\/invoices\//);
        expect(path).not.toMatch(/INV-/);
        expect(path).not.toMatch(/EST-/);
        expect(path).not.toMatch(/CTR-/);
    });

    it('encodes tokens for URL safety', () => {
        // base64url tokens normally need no encoding, but encodeURIComponent is applied
        const token = 'abc.def';
        expect(buildSharePath(token)).toBe('/d/abc.def');
    });
});

describe('withDocumentShareToken', () => {
    it('preserves an existing valid shareToken', () => {
        const existing = 'a'.repeat(32);
        const { doc, minted } = withDocumentShareToken({
            id: 'INV-0201',
            shareToken: existing,
        });
        expect(minted).toBe(false);
        expect(doc.shareToken).toBe(existing);
    });

    it('mints a token when missing', () => {
        const { doc, minted } = withDocumentShareToken({ id: 'INV-0201' });
        expect(minted).toBe(true);
        expect(doc.shareToken).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(doc.shareToken.length).toBeGreaterThanOrEqual(40);
    });

    it('mints a token when existing value is too short', () => {
        const { doc, minted } = withDocumentShareToken({
            id: 'INV-0201',
            shareToken: 'short',
        });
        expect(minted).toBe(true);
        expect(doc.shareToken).not.toBe('short');
        expect(doc.shareToken.length).toBeGreaterThanOrEqual(40);
    });
});

describe('withContractShareToken', () => {
    it('preserves an existing valid shareToken', () => {
        const existing = 'b'.repeat(32);
        const { shareToken, minted } = withContractShareToken({ shareToken: existing });
        expect(minted).toBe(false);
        expect(shareToken).toBe(existing);
    });

    it('mints when null or missing', () => {
        expect(withContractShareToken({ shareToken: null }).minted).toBe(true);
        expect(withContractShareToken({}).minted).toBe(true);
        expect(withContractShareToken({}).shareToken.length).toBeGreaterThanOrEqual(40);
    });
});

describe('buildDocumentSharePath', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('returns /d/{token} for non-lead documents and never sequential id paths', async () => {
        const token = 'c'.repeat(43);
        vi.doMock('@/lib/data', () => ({
            ensureDocumentShareToken: vi.fn(async (doc: { id: string }) => ({
                ...doc,
                shareToken: token,
            })),
        }));
        vi.doMock('@/lib/contracts', () => ({
            ensureContractShareToken: vi.fn(),
        }));

        const { buildDocumentSharePath } = await import('@/lib/document-share-url');
        const path = await buildDocumentSharePath({
            id: 'INV-0201',
            type: 'invoice',
        } as Parameters<typeof buildDocumentSharePath>[0]);

        expect(path).toBe(`/d/${token}`);
        expect(path).not.toContain('INV-0201');
        expect(path).not.toContain('/invoices/');
    });

    it('returns / for leads', async () => {
        vi.doMock('@/lib/data', () => ({
            ensureDocumentShareToken: vi.fn(),
        }));
        vi.doMock('@/lib/contracts', () => ({
            ensureContractShareToken: vi.fn(),
        }));

        const { buildDocumentSharePath } = await import('@/lib/document-share-url');
        const path = await buildDocumentSharePath({
            id: 'LEAD-0001',
            type: 'lead',
        } as Parameters<typeof buildDocumentSharePath>[0]);

        expect(path).toBe('/');
    });
});
