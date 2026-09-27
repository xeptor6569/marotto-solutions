import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { docsBasePath, isDocsHost, parseDoc, type DocPage } from '@/lib/docs';
import { helpTopicFile, type HelpTopic } from '@/lib/help-content';

// Traced into the standalone build via outputFileTracingIncludes (next.config.ts).
const DOCS_DIR = path.join(process.cwd(), 'docs');

export async function readDoc(page: DocPage) {
    const markdown = await fs.readFile(path.join(DOCS_DIR, page.file), 'utf-8');
    return parseDoc(markdown);
}

/** A user-manual topic from `docs/manual/`, shared by the in-app Help and the docs site. */
export async function readHelpTopic(topic: HelpTopic) {
    const markdown = await fs.readFile(path.join(DOCS_DIR, helpTopicFile(topic)), 'utf-8');
    return parseDoc(markdown);
}

export async function getDocsRequestContext(): Promise<{ onDocsHost: boolean; base: string }> {
    const h = await headers();
    const onDocsHost = isDocsHost(h.get('x-forwarded-host') || h.get('host'));
    return { onDocsHost, base: docsBasePath(onDocsHost) };
}
