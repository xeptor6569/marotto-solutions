import { createClient, WebDAVClient } from 'webdav';
import { AppConfig, DocumentData, DocumentType } from './types';

// This is a server-side only utility if we use env vars, 
// OR client-side if we want to connect from browser directly (CORS issues possible).
// Given "Self-host via Docker", server-side operations are safer and avoid CORS if Next.js proxies.
// However, saving to Nextcloud often implies user credentials. 
// I will implement Server Actions for safe interacting with WebDAV.

let client: WebDAVClient | null = null;

export const getWebDAVClient = (url: string, username: string, password?: string) => {
    if (client) return client;

    if (!url || !username) {
        throw new Error("WebDAV credentials missing");
    }

    client = createClient(url, {
        username,
        password
    });
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

// STORAGE PATHS
const DATA_DIR = "/MarottoSolutions";
const CONFIG_FILE = `${DATA_DIR}/config.json`;

export async function ensureDataDir(c: WebDAVClient) {
    if ((await c.exists(DATA_DIR)) === false) {
        await c.createDirectory(DATA_DIR);
    }
}

export async function saveDocument(c: WebDAVClient, doc: DocumentData) {
    await ensureDataDir(c);
    const filename = `${DATA_DIR}/${doc.type}s/${doc.id}.json`;
    // Ensure subfolder
    if ((await c.exists(`${DATA_DIR}/${doc.type}s`)) === false) {
        await c.createDirectory(`${DATA_DIR}/${doc.type}s`);
    }
    await c.putFileContents(filename, JSON.stringify(doc, null, 2));
}

export async function fetchDocuments(c: WebDAVClient, type: DocumentType): Promise<DocumentData[]> {
    await ensureDataDir(c);
    const folder = `${DATA_DIR}/${type}s`;
    if ((await c.exists(folder)) === false) return [];

    const files = await c.getDirectoryContents(folder) as any[]; // Type cast needed often with webdav lib
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
