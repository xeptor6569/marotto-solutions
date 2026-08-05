import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('resolveLegacyDocumentShare', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('redirects anonymous visitors to /d/{shareToken}', async () => {
        const token = 'c'.repeat(43);
        const redirect = vi.fn((path: string) => {
            throw new Error(`REDIRECT:${path}`);
        });

        vi.doMock('next/navigation', () => ({
            notFound: vi.fn(),
            redirect,
        }));
        vi.doMock('@/lib/auth', () => ({
            auth: vi.fn(async () => null),
        }));
        vi.doMock('@/lib/data', () => ({
            getDocumentById: vi.fn(async () => ({
                id: 'EST-0203',
                type: 'estimate',
                shareToken: token,
            })),
            ensureDocumentShareToken: vi.fn(async (doc: { shareToken: string }) => doc),
        }));
        vi.doMock('@/lib/contracts', () => ({
            getContractByDisplayId: vi.fn(),
            ensureContractShareToken: vi.fn(),
        }));

        const { resolveLegacyDocumentShare } = await import('@/lib/legacy-share-redirect');
        await expect(resolveLegacyDocumentShare('EST-0203', 'estimate')).rejects.toThrow(
            `REDIRECT:/d/${token}`,
        );
        expect(redirect).toHaveBeenCalledWith(`/d/${token}`);
    });

    it('returns the document for signed-in admins without redirecting', async () => {
        const doc = { id: 'INV-0201', type: 'invoice' as const, shareToken: 't'.repeat(43) };
        const redirect = vi.fn();

        vi.doMock('next/navigation', () => ({
            notFound: vi.fn(),
            redirect,
        }));
        vi.doMock('@/lib/auth', () => ({
            auth: vi.fn(async () => ({
                user: { email: 'admin@example.com', role: 'admin' },
                expires: new Date().toISOString(),
            })),
        }));
        vi.doMock('@/lib/data', () => ({
            getDocumentById: vi.fn(async () => doc),
            ensureDocumentShareToken: vi.fn(),
        }));
        vi.doMock('@/lib/contracts', () => ({
            getContractByDisplayId: vi.fn(),
            ensureContractShareToken: vi.fn(),
        }));

        const { resolveLegacyDocumentShare } = await import('@/lib/legacy-share-redirect');
        await expect(resolveLegacyDocumentShare('INV-0201', 'invoice')).resolves.toEqual(doc);
        expect(redirect).not.toHaveBeenCalled();
    });

    it('404s when the document type does not match the route', async () => {
        const notFound = vi.fn(() => {
            throw new Error('NOT_FOUND');
        });

        vi.doMock('next/navigation', () => ({
            notFound,
            redirect: vi.fn(),
        }));
        vi.doMock('@/lib/auth', () => ({
            auth: vi.fn(async () => null),
        }));
        vi.doMock('@/lib/data', () => ({
            getDocumentById: vi.fn(async () => ({
                id: 'INV-0201',
                type: 'invoice',
            })),
            ensureDocumentShareToken: vi.fn(),
        }));
        vi.doMock('@/lib/contracts', () => ({
            getContractByDisplayId: vi.fn(),
            ensureContractShareToken: vi.fn(),
        }));

        const { resolveLegacyDocumentShare } = await import('@/lib/legacy-share-redirect');
        await expect(resolveLegacyDocumentShare('INV-0201', 'estimate')).rejects.toThrow('NOT_FOUND');
        expect(notFound).toHaveBeenCalled();
    });
});

describe('resolveLegacyContractShare', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('redirects anonymous visitors to /d/{shareToken}', async () => {
        const token = 'd'.repeat(43);
        const redirect = vi.fn((path: string) => {
            throw new Error(`REDIRECT:${path}`);
        });

        vi.doMock('next/navigation', () => ({
            notFound: vi.fn(),
            redirect,
        }));
        vi.doMock('@/lib/auth', () => ({
            auth: vi.fn(async () => null),
        }));
        vi.doMock('@/lib/data', () => ({
            getDocumentById: vi.fn(),
            ensureDocumentShareToken: vi.fn(),
        }));
        vi.doMock('@/lib/contracts', () => ({
            getContractByDisplayId: vi.fn(async () => ({
                id: 'ctr-1',
                displayId: 'CTR-0001',
                shareToken: token,
            })),
            ensureContractShareToken: vi.fn(async (c: { shareToken: string }) => c),
        }));

        const { resolveLegacyContractShare } = await import('@/lib/legacy-share-redirect');
        await expect(resolveLegacyContractShare('CTR-0001')).rejects.toThrow(`REDIRECT:/d/${token}`);
        expect(redirect).toHaveBeenCalledWith(`/d/${token}`);
    });
});
