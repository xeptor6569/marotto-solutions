import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { auth } from '@/lib/auth';
import { collectBackupData, createBackupArchiveFile, getBackupFilename } from '@/lib/backup';
import { isAdminSession } from '@/lib/require-admin-session';

export async function GET() {
    const session = await auth();
    if (!isAdminSession(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let backupDir: string | undefined;
    let archivePath: string | undefined;
    try {
        backupDir = await collectBackupData();
        const filename = getBackupFilename();
        archivePath = path.join(os.tmpdir(), filename);
        await createBackupArchiveFile(backupDir, archivePath);

        const archiveData = await fs.readFile(archivePath);
        // collectBackupData returns <tmpBase>/app-backup-<ts>, so the parent is
        // the mkdtemp directory that owns everything to clean up.
        const tmpBase = path.dirname(backupDir);

        await fs.rm(tmpBase, { recursive: true, force: true }).catch(() => {});
        await fs.unlink(archivePath).catch(() => {});

        return new Response(archiveData, {
            headers: {
                'Content-Type': 'application/gzip',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Backup failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Backup failed: ${message}` }, { status: 500 });
    }
}
