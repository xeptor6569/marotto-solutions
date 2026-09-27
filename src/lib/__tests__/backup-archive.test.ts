import { describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import * as tar from 'tar';
import { cleanupExtracted, copyBrandingFiles, createBackupArchiveFile, extractBackupArchive } from '@/lib/backup';

async function makeBackupDir(): Promise<{ root: string; backupDir: string }> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
    const backupDir = path.join(root, 'app-backup-2026-01-01T00-00-00-000Z');
    await fs.mkdir(path.join(backupDir, 'db'), { recursive: true });
    await fs.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify({ version: 1, timestamp: 'x', counts: {} }));
    await fs.writeFile(path.join(backupDir, 'db', 'clients.json'), '[]');
    return { root, backupDir };
}

describe('backup archive round trip', () => {
    it('extracts an archive produced by the download flow (contents at tar root)', async () => {
        const { root, backupDir } = await makeBackupDir();
        const archivePath = path.join(root, 'app-backup.tar.gz');
        await createBackupArchiveFile(backupDir, archivePath);

        const extracted = await extractBackupArchive(archivePath);
        expect(extracted.backupDir).toBe(extracted.tmpDir);
        await expect(fs.access(path.join(extracted.backupDir, 'manifest.json'))).resolves.toBeUndefined();
        await expect(fs.access(path.join(extracted.backupDir, 'db', 'clients.json'))).resolves.toBeUndefined();

        await cleanupExtracted(extracted.tmpDir);
        await expect(fs.access(extracted.tmpDir)).rejects.toBeTruthy();
        await fs.rm(root, { recursive: true, force: true });
    });

    it('also accepts an archive with a wrapper folder', async () => {
        const { root, backupDir } = await makeBackupDir();
        const archivePath = path.join(root, 'wrapped.tar.gz');
        await tar.c({ gzip: true, file: archivePath, cwd: root }, [path.basename(backupDir)]);

        const extracted = await extractBackupArchive(archivePath);
        expect(path.basename(extracted.backupDir)).toBe(path.basename(backupDir));
        await expect(fs.access(path.join(extracted.backupDir, 'manifest.json'))).resolves.toBeUndefined();

        await cleanupExtracted(extracted.tmpDir);
        await fs.rm(root, { recursive: true, force: true });
    });

    it('rejects archives without a manifest and files that are not tar.gz', async () => {
        const root = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
        const noManifest = path.join(root, 'nomanifest.tar.gz');
        await fs.writeFile(path.join(root, 'stray.txt'), 'hi');
        await tar.c({ gzip: true, file: noManifest, cwd: root }, ['stray.txt']);
        await expect(extractBackupArchive(noManifest)).rejects.toThrow(/manifest\.json/);

        const notArchive = path.join(root, 'export.json');
        await fs.writeFile(notArchive, '[]');
        await expect(extractBackupArchive(notArchive)).rejects.toThrow(/Could not read the archive/);
        await fs.rm(root, { recursive: true, force: true });
    });

    it('copies branding files but not subdirectories or symlinks', async () => {
        const root = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
        const from = path.join(root, 'from');
        const to = path.join(root, 'to');
        await fs.mkdir(path.join(from, 'nested'), { recursive: true });
        await fs.writeFile(path.join(from, 'logo-1.png'), 'png');
        await fs.writeFile(path.join(from, 'nested', 'x.png'), 'x');
        await fs.writeFile(path.join(root, 'secret.txt'), 'secret');
        await fs.symlink(path.join(root, 'secret.txt'), path.join(from, 'link.png'));

        expect(await copyBrandingFiles(from, to)).toBe(1);
        expect(await fs.readdir(to)).toEqual(['logo-1.png']);
        expect(await copyBrandingFiles(path.join(root, 'missing'), to)).toBe(0);
        await fs.rm(root, { recursive: true, force: true });
    });

    it('cleanupExtracted refuses anything that is not its own scratch directory', async () => {
        const decoy = await fs.mkdtemp(path.join(os.tmpdir(), 'not-ours-'));
        await cleanupExtracted(decoy);
        await expect(fs.access(decoy)).resolves.toBeUndefined();
        await cleanupExtracted(os.tmpdir());
        await expect(fs.access(os.tmpdir())).resolves.toBeUndefined();
        await fs.rm(decoy, { recursive: true, force: true });
    });
});
