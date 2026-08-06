import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DEFAULT_WEBDAV_ROOT_PATH, getAppConfig } from '@/lib/config';
import { getWebDAVClient, normalizeWebdavRootPath } from '@/lib/webdav';

const LOCAL_ATTACHMENTS_DIR = path.join(process.cwd(), 'data', 'job-attachments');
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function normalizeFilename(value: string) {
    const fallback = 'attachment';
    const cleaned = value
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return cleaned || fallback;
}

export function isPreviewableAttachment(mimeType: string) {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

export async function validateAttachment(file: File) {
    if (!file || file.size <= 0) {
        throw new Error('Please choose a file to upload.');
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
        throw new Error('Attachment must be 20MB or smaller.');
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        throw new Error(`File type "${file.type}" is not allowed.`);
    }
}

async function ensureLocalDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

async function saveAttachmentBinary(jobId: string, file: File): Promise<string> {
    const original = normalizeFilename(file.name || 'attachment');
    const basename = `${Date.now()}-${randomUUID()}-${original}`;
    const binary = Buffer.from(await file.arrayBuffer());
    const config = await getAppConfig();
    const webdavUrl = config.webdavUrl;
    const webdavUsername = config.webdavUsername;
    const webdavPassword = config.webdavPassword;

    if (webdavUrl && webdavUsername) {
        const client = getWebDAVClient(webdavUrl, webdavUsername, webdavPassword);
        // Stored paths in the DB are absolute (webdav:/Root/...), so changing
        // the configured root only affects where *new* uploads land.
        const attachmentsRoot = `${normalizeWebdavRootPath(config.webdavRootPath, DEFAULT_WEBDAV_ROOT_PATH)}/job-attachments`;
        const folder = `${attachmentsRoot}/${jobId}`;
        if ((await client.exists(attachmentsRoot)) === false) {
            await client.createDirectory(attachmentsRoot);
        }
        if ((await client.exists(folder)) === false) {
            await client.createDirectory(folder);
        }
        const storagePath = `${folder}/${basename}`;
        await client.putFileContents(storagePath, binary);
        return `webdav:${storagePath}`;
    }

    const localFolder = path.join(LOCAL_ATTACHMENTS_DIR, jobId);
    await ensureLocalDir(localFolder);
    const localPath = path.join(localFolder, basename);
    await fs.writeFile(localPath, binary);
    return `local:${localPath}`;
}

async function deleteAttachmentBinary(storagePath: string) {
    if (storagePath.startsWith('webdav:')) {
        const webdavPath = storagePath.replace(/^webdav:/, '');
        const config = await getAppConfig();
        const webdavUrl = config.webdavUrl;
        const webdavUsername = config.webdavUsername;
        const webdavPassword = config.webdavPassword;
        if (webdavUrl && webdavUsername) {
            const client = getWebDAVClient(webdavUrl, webdavUsername, webdavPassword);
            if (await client.exists(webdavPath)) {
                await client.deleteFile(webdavPath);
            }
        }
        return;
    }
    const localPath = storagePath.replace(/^local:/, '');
    await fs.rm(localPath, { force: true });
}

export async function createJobAttachment(input: {
    jobId: string;
    file: File;
    note?: string;
}) {
    await validateAttachment(input.file);
    const storagePath = await saveAttachmentBinary(input.jobId, input.file);
    return prisma.jobAttachment.create({
        data: {
            jobId: input.jobId,
            filename: normalizeFilename(input.file.name || 'attachment'),
            mimeType: input.file.type,
            sizeBytes: input.file.size,
            storagePath,
            note: input.note?.trim() || null,
        },
    });
}

export async function listJobAttachments(jobId: string) {
    return prisma.jobAttachment.findMany({
        where: { jobId },
        orderBy: { uploadedAt: 'desc' },
    });
}

export async function getJobAttachmentById(id: string) {
    return prisma.jobAttachment.findUnique({
        where: { id },
    });
}

export async function deleteJobAttachment(id: string) {
    const attachment = await prisma.jobAttachment.findUnique({ where: { id } });
    if (!attachment) return;
    await deleteAttachmentBinary(attachment.storagePath);
    await prisma.jobAttachment.delete({ where: { id } });
}

export async function readAttachmentBinary(storagePath: string): Promise<Buffer> {
    if (storagePath.startsWith('webdav:')) {
        const webdavPath = storagePath.replace(/^webdav:/, '');
        const config = await getAppConfig();
        const webdavUrl = config.webdavUrl;
        const webdavUsername = config.webdavUsername;
        const webdavPassword = config.webdavPassword;
        if (!webdavUrl || !webdavUsername) {
            throw new Error('WebDAV is not configured for attachment storage.');
        }
        const client = getWebDAVClient(webdavUrl, webdavUsername, webdavPassword);
        const content = await client.getFileContents(webdavPath, { format: 'binary' });
        return Buffer.from(content as ArrayBuffer);
    }
    const localPath = storagePath.replace(/^local:/, '');
    return fs.readFile(localPath);
}
