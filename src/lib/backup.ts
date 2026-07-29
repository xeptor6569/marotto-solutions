import { TarArchive } from 'archiver';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { getDocuments, saveNewDocument } from '@/lib/data';
import { getAppConfig, saveAppConfig } from '@/lib/config';
import { listPresets, replaceAllPresets } from '@/lib/presets';
import { readAttachmentBinary } from '@/lib/job-attachments';
import type { DocumentData, DocumentType } from '@/lib/types';

const BACKUP_VERSION = 1;
const DOCUMENT_TYPES: DocumentType[] = ['invoice', 'estimate', 'quote', 'receipt', 'lead'];
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_ATTACHMENTS_DIR = path.join(LOCAL_DATA_DIR, 'job-attachments');

// ─── Manifest ────────────────────────────────────────────────────────

export interface BackupManifest {
    version: number;
    timestamp: string;
    webdavConfigured: boolean;
    counts: {
        clients: number;
        helpers: number;
        helperPayouts: number;
        jobs: number;
        contracts: number;
        calendarEvents: number;
        jobAttachments: number;
        documentCounters: number;
        invoices: number;
        estimates: number;
        quotes: number;
        receipts: number;
        leads: number;
    };
}

// ─── Collect ─────────────────────────────────────────────────────────

export async function collectBackupData(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marotto-backup-'));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(tmpDir, `marotto-backup-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    const config = await getAppConfig();
    const webdavConfigured = Boolean(config.webdavUrl?.trim() && config.webdavUsername?.trim());

    const dbDir = path.join(backupDir, 'db');
    const docsDir = path.join(backupDir, 'documents');
    const attDir = path.join(backupDir, 'attachments');
    const cfgDir = path.join(backupDir, 'config');
    await fs.mkdir(dbDir, { recursive: true });
    await fs.mkdir(cfgDir, { recursive: true });

    const counts: Record<string, number> = {
        clients: 0,
        helpers: 0,
        helperPayouts: 0,
        jobs: 0,
        contracts: 0,
        calendarEvents: 0,
        jobAttachments: 0,
        documentCounters: 0,
        invoices: 0,
        estimates: 0,
        quotes: 0,
        receipts: 0,
        leads: 0,
    };

    if (isDatabaseConfigured()) {
        const counters = await prisma.documentCounter.findMany();
        counts.documentCounters = counters.length;
        await fs.writeFile(path.join(dbDir, 'documentCounters.json'), JSON.stringify(counters, null, 2));

        const clients = await prisma.client.findMany();
        counts.clients = clients.length;
        await fs.writeFile(path.join(dbDir, 'clients.json'), JSON.stringify(clients, null, 2));

        const helpers = await prisma.helper.findMany();
        counts.helpers = helpers.length;
        await fs.writeFile(path.join(dbDir, 'helpers.json'), JSON.stringify(helpers, null, 2));

        const helperPayouts = await prisma.helperPayout.findMany();
        counts.helperPayouts = helperPayouts.length;
        await fs.writeFile(path.join(dbDir, 'helperPayouts.json'), JSON.stringify(helperPayouts, null, 2));

        const jobs = await prisma.job.findMany();
        counts.jobs = jobs.length;
        await fs.writeFile(path.join(dbDir, 'jobs.json'), JSON.stringify(jobs, null, 2));

        const contracts = await prisma.contract.findMany({ include: { lines: true } });
        counts.contracts = contracts.length;
        await fs.writeFile(path.join(dbDir, 'contracts.json'), JSON.stringify(contracts, null, 2));

        const events = await prisma.calendarEvent.findMany({
            include: { client: { select: { name: true } }, job: { select: { name: true } } },
        });
        counts.calendarEvents = events.length;
        await fs.writeFile(path.join(dbDir, 'calendarEvents.json'), JSON.stringify(events, null, 2));

        const attachments = await prisma.jobAttachment.findMany();
        counts.jobAttachments = attachments.length;
        await fs.writeFile(path.join(dbDir, 'jobAttachments.json'), JSON.stringify(attachments, null, 2));

        if (attachments.length > 0) {
            await fs.mkdir(attDir, { recursive: true });
            for (const att of attachments) {
                try {
                    const binary = await readAttachmentBinary(att.storagePath);
                    const localFilename = path.basename(att.storagePath.replace(/^(local:|webdav:)/, ''));
                    const jobIdDir = path.join(attDir, att.jobId);
                    await fs.mkdir(jobIdDir, { recursive: true });
                    await fs.writeFile(path.join(jobIdDir, localFilename), binary);
                } catch (e) {
                    console.error(`Failed to read attachment ${att.id}:`, e);
                }
            }
        }
    }

    for (const docType of DOCUMENT_TYPES) {
        const docs = await getDocuments(docType);
        counts[docType] = docs.length;
        if (docs.length > 0) {
            const typeDir = path.join(docsDir, `${docType}s`);
            await fs.mkdir(typeDir, { recursive: true });
            for (const doc of docs) {
                await fs.writeFile(path.join(typeDir, `${doc.id}.json`), JSON.stringify(doc, null, 2));
            }
        }
    }

    try {
        const settingsPath = path.join(LOCAL_DATA_DIR, 'config', 'settings.json');
        const settingsContent = await fs.readFile(settingsPath, 'utf-8');
        await fs.writeFile(path.join(cfgDir, 'settings.json'), settingsContent);
    } catch {
        const configForExport = await getAppConfig();
        await fs.writeFile(path.join(cfgDir, 'settings.json'), JSON.stringify(configForExport, null, 2));
    }

    try {
        const presetsPath = path.join(LOCAL_DATA_DIR, 'config', 'presets.json');
        const presetsContent = await fs.readFile(presetsPath, 'utf-8');
        await fs.writeFile(path.join(cfgDir, 'presets.json'), presetsContent);
    } catch {
        const presets = await listPresets();
        await fs.writeFile(path.join(cfgDir, 'presets.json'), JSON.stringify({ presets }, null, 2));
    }

    const manifest: BackupManifest = {
        version: BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        webdavConfigured,
        counts: counts as BackupManifest['counts'],
    };
    await fs.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    return backupDir;
}

// ─── Archive ─────────────────────────────────────────────────────────

export function createBackupArchiveStream(backupDir: string): TarArchive {
    const archive = new TarArchive({ gzip: true });
    archive.directory(backupDir, false);
    archive.finalize();
    return archive;
}

export async function createBackupArchiveFile(backupDir: string, outputPath: string): Promise<string> {
    const output = createWriteStream(outputPath);
    const archive = createBackupArchiveStream(backupDir);
    await pipeline(archive, output);
    return outputPath;
}

export function getBackupFilename(): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `marotto-backup-${ts}.tar.gz`;
}

// ─── Extract ─────────────────────────────────────────────────────────

export async function extractBackupArchive(archivePath: string): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marotto-restore-'));
    await tar.x({
        file: archivePath,
        cwd: tmpDir,
        gzip: true,
    });

    const entries = await fs.readdir(tmpDir);
    const backupDir = entries.find((e) => e.startsWith('marotto-backup-'));
    if (!backupDir) {
        throw new Error('Archive does not contain a valid backup directory.');
    }
    return path.join(tmpDir, backupDir);
}

// ─── Validate ────────────────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    error?: string;
    manifest?: BackupManifest;
}

export async function validateBackup(backupDir: string): Promise<ValidationResult> {
    const manifestPath = path.join(backupDir, 'manifest.json');
    try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        const manifest: BackupManifest = JSON.parse(content);
        if (manifest.version !== BACKUP_VERSION) {
            return { valid: false, error: `Unsupported backup version: ${manifest.version}. Expected: ${BACKUP_VERSION}.` };
        }
        if (!manifest.timestamp) {
            return { valid: false, error: 'Manifest missing timestamp.' };
        }
        return { valid: true, manifest };
    } catch {
        return { valid: false, error: 'No manifest.json found in archive.' };
    }
}

// ─── Restore ─────────────────────────────────────────────────────────

export interface RestoreStats {
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
}

export async function clearExistingData(): Promise<void> {
    if (!isDatabaseConfigured()) return;

    await prisma.helperPayout.deleteMany();
    await prisma.helper.deleteMany();
    await prisma.contractLine.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.jobAttachment.deleteMany();
    await prisma.jobTimeLog.deleteMany();
    await prisma.job.deleteMany();
    await prisma.client.deleteMany();
    await prisma.documentCounter.deleteMany();

    for (const docType of DOCUMENT_TYPES) {
        const dir = path.join(LOCAL_DATA_DIR, `${docType}s`);
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.unlink(path.join(dir, file));
                }
            }
        } catch { }
    }

    try {
        await fs.rm(LOCAL_ATTACHMENTS_DIR, { recursive: true, force: true });
    } catch { }
}

export async function restoreFromBackup(backupDir: string): Promise<RestoreStats> {
    const stats: RestoreStats = {
        clients: 0,
        helpers: 0,
        helperPayouts: 0,
        jobs: 0,
        contracts: 0,
        contractLines: 0,
        calendarEvents: 0,
        documentCounters: 0,
        jobAttachments: 0,
        documents: 0,
        attachmentsRestored: 0,
        settingsRestored: false,
        presetsRestored: 0,
    };

    await clearExistingData();

    if (isDatabaseConfigured()) {
        const countersPath = path.join(backupDir, 'db', 'documentCounters.json');
        try {
            const counters = JSON.parse(await fs.readFile(countersPath, 'utf-8'));
            for (const row of counters) {
                await prisma.documentCounter.upsert({ where: { type: row.type }, update: row, create: row });
                stats.documentCounters++;
            }
        } catch { }

        const clientsPath = path.join(backupDir, 'db', 'clients.json');
        try {
            const clients = JSON.parse(await fs.readFile(clientsPath, 'utf-8'));
            for (const row of clients) {
                await prisma.client.upsert({ where: { id: row.id }, update: row, create: row });
                stats.clients++;
            }
        } catch { }

        const helpersPath = path.join(backupDir, 'db', 'helpers.json');
        try {
            const helpers = JSON.parse(await fs.readFile(helpersPath, 'utf-8'));
            for (const row of helpers) {
                await prisma.helper.upsert({ where: { id: row.id }, update: row, create: row });
                stats.helpers++;
            }
        } catch { }

        const jobsPath = path.join(backupDir, 'db', 'jobs.json');
        try {
            const jobs = JSON.parse(await fs.readFile(jobsPath, 'utf-8'));
            for (const row of jobs) {
                await prisma.job.upsert({ where: { id: row.id }, update: row, create: row });
                stats.jobs++;
            }
        } catch { }

        const helperPayoutsPath = path.join(backupDir, 'db', 'helperPayouts.json');
        try {
            const helperPayouts = JSON.parse(await fs.readFile(helperPayoutsPath, 'utf-8'));
            for (const row of helperPayouts) {
                await prisma.helperPayout.upsert({ where: { id: row.id }, update: row, create: row });
                stats.helperPayouts++;
            }
        } catch { }

        const contractsPath = path.join(backupDir, 'db', 'contracts.json');
        try {
            const contracts = JSON.parse(await fs.readFile(contractsPath, 'utf-8'));
            for (const row of contracts) {
                const { lines, ...contractData } = row;
                await prisma.contract.upsert({ where: { id: row.id }, update: contractData, create: contractData });
                stats.contracts++;
                if (Array.isArray(lines)) {
                    for (const line of lines) {
                        await prisma.contractLine.upsert({ where: { id: line.id }, update: line, create: line });
                        stats.contractLines++;
                    }
                }
            }
        } catch { }

        const eventsPath = path.join(backupDir, 'db', 'calendarEvents.json');
        try {
            const events = JSON.parse(await fs.readFile(eventsPath, 'utf-8'));
            for (const row of events) {
                const { client: _client, job: _job, ...eventData } = row;
                void _client; void _job;
                await prisma.calendarEvent.upsert({ where: { id: row.id }, update: eventData, create: eventData });
                stats.calendarEvents++;
            }
        } catch { }
    }

    for (const docType of DOCUMENT_TYPES) {
        const typeDir = path.join(backupDir, 'documents', `${docType}s`);
        try {
            const files = await fs.readdir(typeDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const doc: DocumentData = JSON.parse(await fs.readFile(path.join(typeDir, file), 'utf-8'));
                    await saveNewDocument(doc);
                    stats.documents++;
                }
            }
        } catch { }
    }

    if (isDatabaseConfigured()) {
        const attMetaPath = path.join(backupDir, 'db', 'jobAttachments.json');
        const attDir = path.join(backupDir, 'attachments');
        try {
            const attachments = JSON.parse(await fs.readFile(attMetaPath, 'utf-8'));
            for (const att of attachments) {
                const localFilename = path.basename(att.storagePath.replace(/^(local:|webdav:)/, ''));
                const binaryPath = path.join(attDir, att.jobId, localFilename);
                stats.jobAttachments++;
                try {
                    const binary = await fs.readFile(binaryPath);
                    const localDir = path.join(LOCAL_ATTACHMENTS_DIR, att.jobId);
                    await fs.mkdir(localDir, { recursive: true });
                    const newStoragePath = `local:${path.join(localDir, localFilename)}`;
                    await fs.writeFile(path.join(localDir, localFilename), binary);
                    await prisma.jobAttachment.upsert({
                        where: { id: att.id },
                        update: { ...att, storagePath: newStoragePath },
                        create: { ...att, storagePath: newStoragePath },
                    });
                    stats.attachmentsRestored++;
                } catch (e) {
                    console.error(`Failed to restore attachment binary ${att.id}:`, e);
                    await prisma.jobAttachment.upsert({
                        where: { id: att.id },
                        update: { ...att, storagePath: att.storagePath },
                        create: att,
                    });
                }
            }
        } catch { }
    }

    const settingsPath = path.join(backupDir, 'config', 'settings.json');
    try {
        const settingsContent = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
        await saveAppConfig(settingsContent);
        stats.settingsRestored = true;
    } catch { }

    const presetsPath = path.join(backupDir, 'config', 'presets.json');
    try {
        const presetsContent = JSON.parse(await fs.readFile(presetsPath, 'utf-8'));
        stats.presetsRestored = await replaceAllPresets(presetsContent);
    } catch { }

    return stats;
}

export async function cleanupExtracted(tmpDir: string): Promise<void> {
    try {
        await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { }
}
