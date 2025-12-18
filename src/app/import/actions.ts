'use server';

import { saveNewDocument } from '@/lib/data';
import { DocumentData } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Simple validation
function isValidDocument(doc: any): doc is DocumentData {
    return (
        typeof doc === 'object' &&
        doc !== null &&
        typeof doc.id === 'string' &&
        (doc.type === 'invoice' || doc.type === 'estimate' || doc.type === 'receipt') &&
        typeof doc.number === 'number'
    );
}

export async function importDocumentsAction(formData: FormData) {
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
        return { success: true, count, errors };

    } catch (e: any) {
        console.error("Import error", e);
        return { success: false, error: 'Failed to process file: ' + e.message };
    }
}
