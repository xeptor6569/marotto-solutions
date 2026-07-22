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
                id: 'INV-0201',
                type: 'invoice',
                shareToken: token,
            })),
            ensureDocumentShareToken: vi.fn(async (doc: { shareToken: string }) => doc),
        }));
        vi.doMock('@/lib/contracts', () => ({
            getContractByDisplayId: vi.fn(),
            ensureContractShareToken: vi.fn(),
        }));

        const { resolveLegacyDocumentShare } = await import('@/lib/legacy-share-redirect');
        await expect(resolveLegacyDocumentShare('INV-0201', 'invoice')).rejects.toThrow(
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
});
