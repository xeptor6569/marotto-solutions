import { auth } from '@/lib/auth';
import { isAdminSession } from '@/lib/admin-auth';
import {
    ensureContractShareToken,
    getContractByDisplayId,
    type ContractRecord,
} from '@/lib/contracts';
import { ensureDocumentShareToken, getDocumentById } from '@/lib/data';
import { buildSharePath } from '@/lib/share-token';
import type { DocumentData, DocumentType } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';

/**
 * Resolve a legacy sequential document URL (`/invoices/INV-0201`, etc.).
 *
 * - Signed-in admins get the full admin preview.
 * - Everyone else is redirected to the unguessable `/d/{shareToken}` link so
 *   old emailed URLs keep working for customers without a 404.
 */
export async function resolveLegacyDocumentShare(
    id: string,
    expectedType: Exclude<DocumentType, 'lead'>,
): Promise<DocumentData> {
    const doc = await getDocumentById(id);
    if (!doc || doc.type !== expectedType) {
        notFound();
    }

    const session = await auth();
    if (isAdminSession(session)) {
        return doc;
    }

    const ensured = await ensureDocumentShareToken(doc);
    redirect(buildSharePath(ensured.shareToken));
}

/**
 * Resolve a legacy contract display URL (`/contracts/CTR-0001`).
 * Same admin vs client-redirect behavior as documents.
 */
export async function resolveLegacyContractShare(id: string): Promise<ContractRecord> {
    const contract = await getContractByDisplayId(id);
    if (!contract) {
        notFound();
    }

    const session = await auth();
    if (isAdminSession(session)) {
        return contract;
    }

    const ensured = await ensureContractShareToken(contract);
    redirect(buildSharePath(ensured.shareToken));
}
