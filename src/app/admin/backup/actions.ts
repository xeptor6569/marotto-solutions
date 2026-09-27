'use server';

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { extractBackupArchive, validateBackup, restoreFromBackup, cleanupExtracted } from '@/lib/backup';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/require-admin-session';

export interface RestoreResult {
    success: boolean;
    error?: string;
    stats?: {
        clients: number;
        helpers: number;
        helperPayouts: number;
        jobs: number;
        contracts: number;
        contractLines: number;
        calendarEvents: number;
        documentCounters: number;
        jobAttachments: number;
        documents: number;
        attachmentsRestored: number;
        settingsRestored: boolean;
        remoteStorageStripped: boolean;
        presetsRestored: number;
    };
}

export async function restoreBackupAction(formData: FormData): Promise<RestoreResult> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, error: 'No file uploaded.' };
    }

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.json')) {
        return {
            success: false,
            error: 'That is a JSON document export. Restore expects the .tar.gz backup archive downloaded from this page; to import individual documents from JSON, use Import instead.',
        };
    }
    if (!lowerName.endsWith('.tar.gz') && !lowerName.endsWith('.tgz') && !lowerName.endsWith('.gz')) {
        return { success: false, error: 'File must be the .tar.gz backup archive downloaded from this page.' };
    }

    let archivePath: string | undefined;
    let scratchDir: string | undefined;

    try {
        archivePath = path.join(os.tmpdir(), `marotto-restore-upload-${Date.now()}.tar.gz`);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(archivePath, buffer);

        const extracted = await extractBackupArchive(archivePath);
        scratchDir = extracted.tmpDir;

        const validation = await validateBackup(extracted.backupDir);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const stats = await restoreFromBackup(extracted.backupDir);

        revalidatePath('/admin');
        revalidatePath('/admin/jobs');
        revalidatePath('/admin/clients');
        revalidatePath('/admin/estimates');
        revalidatePath('/admin/quotes');
        revalidatePath('/admin/invoices');
        revalidatePath('/admin/receipts');
        revalidatePath('/admin/contracts');
        revalidatePath('/admin/calendar');
        revalidatePath('/admin/settings');
        revalidatePath('/dashboard');
        revalidatePath('/');

        return { success: true, stats };
    } catch (error) {
        console.error('Restore failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Restore failed: ${message}` };
    } finally {
        if (archivePath) await fs.unlink(archivePath).catch(() => {});
        if (scratchDir) await cleanupExtracted(scratchDir);
    }
}
