import { createClient, WebDAVClient } from 'webdav';
import { AppConfig, DocumentData, DocumentType } from './types';

// Server-side WebDAV access for document storage. Server Actions are the only
// callers, so credentials never reach the browser and CORS is not a concern.

let cachedClient: { key: string; client: WebDAVClient } | null = null;

export const getWebDAVClient = (url: string, username: string, password?: string) => {
    if (!url || !username) {
        throw new Error("WebDAV credentials missing");
    }

    // Key the cache on the credentials so saving new settings takes effect
    // without a server restart.
    const key = `${url}\u0000${username}\u0000${password ?? ''}`;
    if (cachedClient?.key === key) return cachedClient.client;

    const client = createClient(url, {
        username,
        password
    });
    cachedClient = { key, client };
    return client;
};

export async function checkConnection(config: AppConfig, password?: string) {
    const c = getWebDAVClient(config.webdavUrl, config.webdavUsername, password);
    try {
        await c.getDirectoryContents("/");
        return true;
    } catch (e) {
        console.error("WebDAV Connection Error:", e);
        return false;
    }
}

/** Normalize a configured root path to "/Segment[/Sub]" form. */
export function normalizeWebdavRootPath(raw: string | undefined, fallback: string): string {
    const trimmed = (raw || '').trim().replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}` : fallback;
}

export async function ensureDataDir(c: WebDAVClient, rootPath: string) {
    if ((await c.exists(rootPath)) === false) {
        await c.createDirectory(rootPath);
    }
}

export async function saveDocument(c: WebDAVClient, rootPath: string, doc: DocumentData) {
    await ensureDataDir(c, rootPath);
    const filename = `${rootPath}/${doc.type}s/${doc.id}.json`;
    // Ensure subfolder
    if ((await c.exists(`${rootPath}/${doc.type}s`)) === false) {
        await c.createDirectory(`${rootPath}/${doc.type}s`);
    }
    await c.putFileContents(filename, JSON.stringify(doc, null, 2));
}

export async function deleteDocumentRemote(c: WebDAVClient, rootPath: string, type: DocumentType, id: string) {
    const filename = `${rootPath}/${type}s/${id}.json`;
    if (await c.exists(filename)) {
        await c.deleteFile(filename);
    }
}

export async function fetchDocuments(c: WebDAVClient, rootPath: string, type: DocumentType): Promise<DocumentData[]> {
    await ensureDataDir(c, rootPath);
    const folder = `${rootPath}/${type}s`;
    if ((await c.exists(folder)) === false) return [];

    const rawFiles = await c.getDirectoryContents(folder);
    const files = (Array.isArray(rawFiles) ? rawFiles : []) as Array<{ type?: string; filename: string }>;
    const docs: DocumentData[] = [];

    for (const file of files) {
        if (file.type === 'file' && file.filename.endsWith('.json')) {
            try {
                const content = await c.getFileContents(file.filename, { format: 'text' });
                docs.push(JSON.parse(content as string));
            } catch (e) {
                console.error(`Failed to parse ${file.filename}`, e);
            }
        }
    }
    return docs;
}
