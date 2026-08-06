'use server';

import { saveNewDocument } from '@/lib/data';
import { DocumentData } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/require-admin-session';

// Simple validation
function isValidDocument(doc: unknown): doc is DocumentData {
    if (typeof doc !== 'object' || doc === null) return false;
    const candidate = doc as Partial<DocumentData>;
    return (
        typeof candidate.id === 'string' &&
        (candidate.type === 'invoice' || candidate.type === 'estimate' || candidate.type === 'quote' || candidate.type === 'receipt') &&
        typeof candidate.number === 'number'
    );
}

export async function importDocumentsAction(formData: FormData) {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file uploaded' };
    }

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
            return { success: false, error: 'JSON must be an array of documents' };
        }

        let count = 0;
        let errors = 0;

        for (const doc of data) {
            if (isValidDocument(doc)) {
                // Ensure ID consistency or let saveNewDocument handle it.
                // saveNewDocument checks WebDAV paths.
                // We might want to ensure 'createdAt' etc are present.
                if (!doc.createdAt) doc.createdAt = new Date().toISOString();
                if (!doc.updatedAt) doc.updatedAt = new Date().toISOString();

                await saveNewDocument(doc as DocumentData);
                count++;
            } else {
                errors++;
            }
        }

        revalidatePath('/');
        revalidatePath('/dashboard');
        return { success: true, count, errors };

    } catch (e: unknown) {
        console.error("Import error", e);
        const message = e instanceof Error ? e.message : 'Unknown error';
        return { success: false, error: 'Failed to process file: ' + message };
    }
}
