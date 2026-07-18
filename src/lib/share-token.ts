import { randomBytes } from 'crypto';
import type { DocumentData } from '@/lib/types';

/** Cryptographically random URL-safe share token (256 bits). */
export function generateShareToken(): string {
    return randomBytes(32).toString('base64url');
}

/** Public path for a document or contract share link. */
export function buildSharePath(shareToken: string): string {
    return `/d/${encodeURIComponent(shareToken)}`;
}

/**
 * Returns a document with a shareToken, minting one if missing.
 * Caller is responsible for persisting when a new token was minted.
 */
export function withDocumentShareToken<T extends Pick<DocumentData, 'shareToken'>>(
    doc: T,
): { doc: T & { shareToken: string }; minted: boolean } {
    if (doc.shareToken && doc.shareToken.length >= 16) {
        return { doc: doc as T & { shareToken: string }, minted: false };
    }
    return { doc: { ...doc, shareToken: generateShareToken() }, minted: true };
}

/**
 * Returns a share token for a contract-like record, minting if missing.
 * Caller is responsible for persisting when a new token was minted.
 */
export function withContractShareToken<T extends { shareToken?: string | null }>(
    record: T,
): { shareToken: string; minted: boolean } {
    if (record.shareToken && record.shareToken.length >= 16) {
        return { shareToken: record.shareToken, minted: false };
    }
    return { shareToken: generateShareToken(), minted: true };
}
