import { getAppConfig } from './config';
import { getWebDAVClient, fetchDocuments, saveDocument, deleteDocumentRemote } from './webdav';
import { isDatabaseConfigured, prisma } from './prisma';
import { AppConfig, DocumentData, DocumentType } from './types';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

async function ensureLocalDir(dir: string) {
    try {
        await fs.mkdir(dir, { recursive: true, mode: 0o777 });
    } catch (error: unknown) {
        const err = error as NodeJS.ErrnoException;
        if (err?.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function fetchDocumentsLocal(type: DocumentType): Promise<DocumentData[]> {
    const dir = path.join(LOCAL_DATA_DIR, `${type}s`);
    await ensureLocalDir(dir);

    const files = await fs.readdir(dir);
    const docs: DocumentData[] = [];

    for (const file of files) {
        if (file.endsWith('.json')) {
            try {
                const content = await fs.readFile(path.join(dir, file), 'utf-8');
                docs.push(JSON.parse(content));
            } catch (e) {
                console.error(`Failed to parse local file ${file}`, e);
            }
        }
    }

    return docs;
}

async function saveDocumentLocal(doc: DocumentData) {
    const dir = path.join(LOCAL_DATA_DIR, `${doc.type}s`);
    await ensureLocalDir(dir);
    await fs.writeFile(path.join(dir, `${doc.id}.json`), JSON.stringify(doc, null, 2));
}

async function deleteDocumentLocal(type: DocumentType, id: string) {
    const file = path.join(LOCAL_DATA_DIR, `${type}s`, `${id}.json`);
    try {
        await fs.unlink(file);
    } catch (error: unknown) {
        const err = error as NodeJS.ErrnoException;
        if (err?.code !== 'ENOENT') throw error;
    }
}

// Simple in-memory cache for now (server lifetime). 
// For production with multiple replicas, use Redis or just rely on WebDAV if fast enough.
// Since it's for 1 user, direct WebDAV with short cache is okay.
const CACHE_TTL = 30 * 1000; // 30 seconds
const cache: Record<string, { data: DocumentData[], timestamp: number }> = {};
const NUMBER_BASELINE: Partial<Record<DocumentType, number>> = {
    invoice: 200,
    estimate: 200,
    quote: 200,
    receipt: 200,
};

export async function getDocuments(type: DocumentType): Promise<DocumentData[]> {
    // Check cache first
    const now = Date.now();
    if (cache[type] && (now - cache[type].timestamp < CACHE_TTL)) {
        return cache[type].data;
    }

    const config = await getAppConfig() as AppConfig;
    let docs: DocumentData[] = [];

    if (!useWebDAVStorage(config)) {
        // Fallback to local storage
        docs = await fetchDocumentsLocal(type);
    } else {
        try {
            const client = getWebDAVClient(
                config.webdavUrl!,
                config.webdavUsername!,
                config.webdavPassword,
            );
            docs = await fetchDocuments(client, type);
        } catch (error) {
            console.error(`Error fetching ${type}s from WebDAV:`, error);
            // Fallback to local? Maybe not if configured but failed. 
            // For now, return empty or local? Let's return local if WebDAV fails? 
            // No, that might be confusing. Just log and return empty.
            return [];
        }
    }

    // Sort by date desc
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    cache[type] = { data: docs, timestamp: now };
    return docs;
}

export async function getDocumentById(id: string): Promise<DocumentData | undefined> {
    const types: DocumentType[] = ['invoice', 'estimate', 'quote', 'receipt', 'lead'];
    for (const type of types) {
        const docs = await getDocuments(type);
        const found = docs.find(d => d.id === id);
        if (found) return found;
    }
    return undefined;
}

function useWebDAVStorage(config: AppConfig): boolean {
    return Boolean(config.webdavUrl?.trim() && config.webdavUsername?.trim());
}

export async function saveNewDocument(doc: DocumentData) {
    const config = await getAppConfig() as AppConfig;

    if (!useWebDAVStorage(config)) {
        await saveDocumentLocal(doc);
    } else {
        const client = getWebDAVClient(
            config.webdavUrl!,
            config.webdavUsername!,
            config.webdavPassword,
        );
        await saveDocument(client, doc);
    }

    // Invalidate cache
    delete cache[doc.type];
}

export async function deleteDocument(type: DocumentType, id: string) {
    const config = await getAppConfig() as AppConfig;

    if (!useWebDAVStorage(config)) {
        await deleteDocumentLocal(type, id);
    } else {
        const client = getWebDAVClient(
            config.webdavUrl!,
            config.webdavUsername!,
            config.webdavPassword,
        );
        await deleteDocumentRemote(client, type, id);
    }

    delete cache[type];
}

async function getMaxNumberFromStore(type: DocumentType): Promise<number> {
    const docs = await getDocuments(type);
    if (docs.length === 0) return 0;
    return Math.max(...docs.map((d) => d.number || 0));
}

async function getNextNumberAtomic(type: DocumentType, baseline: number): Promise<number> {
    const fileMax = await getMaxNumberFromStore(type);
    return prisma.$transaction(async (tx) => {
        const existing = await tx.documentCounter.findUnique({ where: { type } });
        const currentValue = Math.max(existing?.lastValue ?? 0, fileMax, baseline - 1);
        const next = currentValue + 1;
        await tx.documentCounter.upsert({
            where: { type },
            update: { lastValue: next },
            create: { type, lastValue: next },
        });
        return next;
    });
}

export async function getNextNumber(type: DocumentType): Promise<number> {
    const baseline = NUMBER_BASELINE[type] ?? 1;
    if (isDatabaseConfigured()) {
        try {
            return await getNextNumberAtomic(type, baseline);
        } catch (error) {
            console.error(`Falling back to filesystem numbering for ${type}`, error);
        }
    }
    const max = await getMaxNumberFromStore(type);
    return Math.max(max + 1, baseline);
}
