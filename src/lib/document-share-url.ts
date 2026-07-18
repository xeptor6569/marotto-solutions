import { ensureDocumentShareToken } from '@/lib/data';
import { ensureContractShareToken, type ContractRecord } from '@/lib/contracts';
import { buildSharePath } from '@/lib/share-token';
import type { DocumentData } from '@/lib/types';

/** Relative public share path for a document (`/d/{token}`). */
export async function buildDocumentSharePath(doc: DocumentData): Promise<string> {
    if (doc.type === 'lead') return '/';
    const ensured = await ensureDocumentShareToken(doc);
    return buildSharePath(ensured.shareToken);
}

/** Absolute public share URL for a document. */
export async function buildDocumentShareUrl(doc: DocumentData, baseUrl: string): Promise<string> {
    const base = baseUrl.replace(/\/$/, '');
    if (doc.type === 'lead') return `${base}/`;
    const path = await buildDocumentSharePath(doc);
    return `${base}${path}`;
}

/** Relative public share path for a contract (`/d/{token}`). */
export async function buildContractSharePath(contract: ContractRecord): Promise<string> {
    const ensured = await ensureContractShareToken(contract);
    return buildSharePath(ensured.shareToken);
}
