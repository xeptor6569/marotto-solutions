import { getAppConfig } from './config';
import { getWebDAVClient, fetchDocuments, saveDocument } from './webdav';
import { AppConfig, DocumentData, DocumentType } from './types';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');

async function ensureLocalDir(dir: string) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
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

// Simple in-memory cache for now (server lifetime). 
// For production with multiple replicas, use Redis or just rely on WebDAV if fast enough.
// Since it's for 1 user, direct WebDAV with short cache is okay.
const CACHE_TTL = 30 * 1000; // 30 seconds
const cache: Record<string, { data: DocumentData[], timestamp: number }> = {};

export async function getDocuments(type: DocumentType): Promise<DocumentData[]> {
    const config = await getAppConfig() as AppConfig;
    let docs: DocumentData[] = [];

    if (!config.webdavUrl || !config.webdavUsername) {
        // Fallback to local storage
        docs = await fetchDocumentsLocal(type);
    } else {
        try {
            const client = getWebDAVClient(config.webdavUrl, config.webdavUsername, config.webdavPassword);
            docs = await fetchDocuments(client, type);
        } catch (error) {
            console.error(`Error fetching ${type}s from WebDAV:`, error);
            // Fallback to local? Maybe not if configured but failed. 
            // For now, return empty or local? Let's return local if WebDAV fails? 
            // No, that might be confusing. Just log and return empty.
            return [];
        }
    }

    // Check cache
    const now = Date.now();
    if (cache[type] && (now - cache[type].timestamp < CACHE_TTL)) {
        return cache[type].data;
    }

    // Sort by date desc
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    cache[type] = { data: docs, timestamp: now };
    return docs;
}

export async function getDocumentById(id: string): Promise<DocumentData | undefined> {
    const types: DocumentType[] = ['invoice', 'estimate', 'receipt'];
    for (const type of types) {
        const docs = await getDocuments(type);
        const found = docs.find(d => d.id === id);
        if (found) return found;
    }
    return undefined;
}

export async function saveNewDocument(doc: DocumentData) {
    const config = await getAppConfig() as AppConfig;

    if (!config.webdavUrl) {
        await saveDocumentLocal(doc);
    } else {
        const client = getWebDAVClient(config.webdavUrl, config.webdavUsername, config.webdavPassword);
        await saveDocument(client, doc);
    }

    // Invalidate cache
    delete cache[doc.type];
}

export async function getNextNumber(type: DocumentType): Promise<number> {
    // For now, scan all files to find max. 
    // Optimization: Store last number in config (less reliable if files added externally) or dedicated counter file.
    // Simpler/Robust: Scan all.
    const docs = await getDocuments(type);
    if (docs.length === 0) return 1;

    const max = Math.max(...docs.map(d => d.number || 0));
    return max + 1;
}
