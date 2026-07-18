'use server';

import { getDocuments, saveNewDocument } from '@/lib/data';
import { DocumentData } from '@/lib/types';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/require-admin-session';

// Simple validation
function isValidDocument(doc: any): doc is DocumentData {
    return (
        typeof doc === 'object' &&
        doc !== null &&
        typeof doc.id === 'string' &&
        (doc.type === 'invoice' || doc.type === 'estimate' || doc.type === 'quote' || doc.type === 'receipt') &&
        typeof doc.number === 'number'
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

    } catch (e: any) {
        console.error("Import error", e);
        return { success: false, error: 'Failed to process file: ' + e.message };
    }
}

export interface MigrateLeadsResult {
    success: boolean;
    error?: string;
    created?: number;
    skipped?: number;
    total?: number;
}

/**
 * One-time migration: convert existing lead documents (LEAD-####) into Client
 * records. Deduplicates against existing clients by email (case-insensitive),
 * falling back to name when a lead has no email. Safe to run multiple times.
 */
export async function migrateLeadsToClientsAction(): Promise<MigrateLeadsResult> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    if (!isDatabaseConfigured()) {
        return { success: false, error: 'DATABASE_URL is not configured, so clients cannot be created.' };
    }

    try {
        const leads = await getDocuments('lead');
        const existing = await prisma.client.findMany({ select: { name: true, email: true } });

        const existingEmails = new Set(
            existing.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[],
        );
        const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

        let created = 0;
        let skipped = 0;

        for (const lead of leads) {
            const name = lead.customer.name?.trim();
            if (!name) {
                skipped++;
                continue;
            }
            const email = lead.customer.email?.trim() || null;
            const emailKey = email?.toLowerCase();
            const nameKey = name.toLowerCase();

            const isDuplicate = emailKey
                ? existingEmails.has(emailKey)
                : existingNames.has(nameKey);
            if (isDuplicate) {
                skipped++;
                continue;
            }

            await prisma.client.create({
                data: {
                    name,
                    email,
                    phone: lead.customer.phone?.trim() || null,
                    address: lead.customer.address?.trim() || null,
                    notes: lead.notes?.trim() || null,
                    isProspect: true,
                },
            });
            created++;
            if (emailKey) existingEmails.add(emailKey);
            existingNames.add(nameKey);
        }

        revalidatePath('/admin/clients');
        revalidatePath('/admin');
        return { success: true, created, skipped, total: leads.length };
    } catch (e: unknown) {
        console.error('migrateLeadsToClientsAction', e);
        const message = e instanceof Error ? e.message : 'Unknown error';
        return { success: false, error: 'Migration failed: ' + message };
    }
}
