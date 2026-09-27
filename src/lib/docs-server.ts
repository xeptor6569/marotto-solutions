import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { docsBasePath, isDocsHost, parseDoc, type DocPage } from '@/lib/docs';

// Traced into the standalone build via outputFileTracingIncludes (next.config.ts).
const DOCS_DIR = path.join(process.cwd(), 'docs');

export async function readDoc(page: DocPage) {
    const markdown = await fs.readFile(path.join(DOCS_DIR, page.file), 'utf-8');
    return parseDoc(markdown);
}

export async function getDocsRequestContext(): Promise<{ onDocsHost: boolean; base: string }> {
    const h = await headers();
    const onDocsHost = isDocsHost(h.get('x-forwarded-host') || h.get('host'));
    return { onDocsHost, base: docsBasePath(onDocsHost) };
}
