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

    if (!file.name.endsWith('.tar.gz') && !file.name.endsWith('.tgz')) {
        return { success: false, error: 'File must be a .tar.gz archive.' };
    }

    let archivePath: string | undefined;
    let extractDir: string | undefined;

    try {
        archivePath = path.join(os.tmpdir(), `marotto-restore-${Date.now()}.tar.gz`);
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(archivePath, buffer);

        extractDir = await extractBackupArchive(archivePath);

        const validation = await validateBackup(extractDir);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const stats = await restoreFromBackup(extractDir);

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
        if (extractDir) {
            const tmpBase = extractDir.substring(0, extractDir.lastIndexOf(path.sep + 'marotto-backup-'));
            await cleanupExtracted(tmpBase);
        }
    }
}
