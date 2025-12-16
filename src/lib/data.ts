import { getAppConfig } from './config';
import { getWebDAVClient, fetchDocuments, saveDocument } from './webdav';
import { AppConfig, DocumentData, DocumentType } from './types';

// Simple in-memory cache for now (server lifetime). 
// For production with multiple replicas, use Redis or just rely on WebDAV if fast enough.
// Since it's for 1 user, direct WebDAV with short cache is okay.
const CACHE_TTL = 30 * 1000; // 30 seconds
const cache: Record<string, { data: DocumentData[], timestamp: number }> = {};

export async function getDocuments(type: DocumentType): Promise<DocumentData[]> {
    const config = await getAppConfig() as AppConfig;
    if (!config.webdavUrl || !config.webdavUsername) {
        return [];
    }

    // Check cache
    const now = Date.now();
    if (cache[type] && (now - cache[type].timestamp < CACHE_TTL)) {
        return cache[type].data;
    }

    try {
        const client = getWebDAVClient(config.webdavUrl, config.webdavUsername, config.webdavPassword);
        const docs = await fetchDocuments(client, type);

        // Sort by date desc
        docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        cache[type] = { data: docs, timestamp: now };
        return docs;
    } catch (error) {
        console.error(`Error fetching ${type}s:`, error);
        return [];
    }
}

export async function saveNewDocument(doc: DocumentData) {
    const config = await getAppConfig() as AppConfig;
    if (!config.webdavUrl) throw new Error("Not configured");

    const client = getWebDAVClient(config.webdavUrl, config.webdavUsername, config.webdavPassword);
    await saveDocument(client, doc);

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
