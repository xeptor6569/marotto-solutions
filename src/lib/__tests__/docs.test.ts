import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
    DOC_PAGES,
    DOCS_REPO_URL,
    isDocsHost,
    parseDoc,
    resolveDocLink,
    rewriteDocHref,
    rewriteHelpHref,
    slugifyHeading,
    type DocDir,
} from '@/lib/docs';
import { HELP_TOPICS, helpTopicFile, MANUAL_DIR } from '@/lib/help-content';

describe('isDocsHost', () => {
    it('detects a docs.* hostname by default, ignoring port and case', () => {
        expect(isDocsHost('docs.example.com', '')).toBe(true);
        expect(isDocsHost('Docs.Example.com:443', '')).toBe(true);
        expect(isDocsHost('example.com', '')).toBe(false);
        expect(isDocsHost('mydocs.example.com', '')).toBe(false);
        expect(isDocsHost(null, '')).toBe(false);
    });

    it('uses DOCS_HOST exactly when configured', () => {
        expect(isDocsHost('help.example.com', 'help.example.com')).toBe(true);
        expect(isDocsHost('docs.example.com', 'https://help.example.com/')).toBe(false);
        expect(isDocsHost('help.example.com:8080', 'https://help.example.com')).toBe(true);
    });
});

describe('slugifyHeading', () => {
    it('matches GitHub anchors used by cross-links in the guides', () => {
        expect(slugifyHeading('Environment variables')).toBe('environment-variables');
        expect(slugifyHeading('Option B: nginx')).toBe('option-b-nginx');
        expect(slugifyHeading('1. Download the code')).toBe('1-download-the-code');
        expect(slugifyHeading('Backups & upgrades')).toBe('backups--upgrades');
    });
});

describe('rewriteDocHref', () => {
    it('maps guide files to site routes on both hosts', () => {
        expect(rewriteDocHref('configuration.md#environment-variables', '/docs')).toBe('/docs/configuration#environment-variables');
        expect(rewriteDocHref('./deployment.md', '')).toBe('/deployment');
        expect(rewriteDocHref('README.md', '')).toBe('/');
        expect(rewriteDocHref('README.md', '/docs')).toBe('/docs');
    });

    it('sends other repo files to GitHub and leaves absolute links alone', () => {
        expect(rewriteDocHref('dev-environment.md', '')).toBe(`${DOCS_REPO_URL}/blob/main/docs/dev-environment.md`);
        expect(rewriteDocHref('../README.md#local-development', '')).toBe(`${DOCS_REPO_URL}/blob/main/README.md#local-development`);
        expect(rewriteDocHref('https://caddyserver.com', '')).toBe('https://caddyserver.com');
        expect(rewriteDocHref('#email', '')).toBe('#email');
    });
});

describe('parseDoc', () => {
    it('splits the title and outlines h2s outside code fences', () => {
        const doc = parseDoc('# Title\n\nIntro\n\n## First `step`\n\n```bash\n## not a heading\n```\n\n## Second\n');
        expect(doc.title).toBe('Title');
        expect(doc.body.startsWith('Intro')).toBe(true);
        expect(doc.headings).toEqual([
            { id: 'first-step', text: 'First step' },
            { id: 'second', text: 'Second' },
        ]);
    });
});

describe('manual links', () => {
    it('resolve relative to docs/manual on the site and in the app', () => {
        expect(rewriteDocHref('payments.md#recording-payments', '', 'manual')).toBe('/manual/payments#recording-payments');
        expect(rewriteDocHref('../deployment.md#scheduled-jobs', '/docs', 'manual')).toBe('/docs/deployment#scheduled-jobs');
        expect(rewriteDocHref('manual/first-job.md', '')).toBe('/manual/first-job');
        expect(rewriteDocHref('README.md#user-manual', '/docs')).toBe('/docs#user-manual');
        expect(rewriteHelpHref('first-job.md')).toBe('/admin/help/first-job');
        expect(rewriteHelpHref('../configuration.md#email')).toBe('/docs/configuration#email');
        expect(rewriteHelpHref('../../README.md')).toBe(`${DOCS_REPO_URL}/blob/main/README.md`);
    });

    it('keep in-page and absolute links untouched', () => {
        expect(resolveDocLink('#events', 'manual')).toEqual({ kind: 'external', href: '#events' });
        expect(rewriteHelpHref('/admin/settings')).toBe('/admin/settings');
    });
});

describe('markdown files', () => {
    const docsDir = path.join(process.cwd(), 'docs');
    const files: Array<{ file: string; dir: DocDir }> = [
        { file: 'README.md', dir: '' },
        ...DOC_PAGES.map((page): { file: string; dir: DocDir } => ({ file: page.file, dir: '' })),
        ...HELP_TOPICS.map((topic): { file: string; dir: DocDir } => ({ file: helpTopicFile(topic), dir: MANUAL_DIR })),
    ];
    const read = (file: string) => fs.readFileSync(path.join(docsDir, file), 'utf-8');
    const headingIds = (md: string) =>
        new Set([...md.matchAll(/^#{2,4} (.+)$/gm)].map((m) => slugifyHeading(m[1].replace(/`/g, '').replace(/\*\*/g, ''))));

    it('every registered guide exists and has a title', () => {
        for (const page of DOC_PAGES) {
            expect(parseDoc(read(page.file)).title, page.file).not.toBe('');
        }
    });

    it('every manual topic has a file whose title matches the registry', () => {
        for (const topic of HELP_TOPICS) {
            expect(parseDoc(read(helpTopicFile(topic))).title, topic.slug).toBe(topic.title);
        }
        expect(fs.readdirSync(path.join(docsDir, MANUAL_DIR)).sort())
            .toEqual(HELP_TOPICS.map((topic) => `${topic.slug}.md`).sort());
    });

    it('relative links point at pages and headings that exist', () => {
        const byTarget = new Map<string, Set<string>>();
        for (const { file } of files) byTarget.set(file, headingIds(read(file)));

        for (const { file, dir } of files) {
            for (const [, href] of read(file).matchAll(/\]\(([^)\s]+)\)/g)) {
                const target = resolveDocLink(href, dir);
                const label = `${file} → ${href}`;
                if (target.kind === 'external') continue;
                if (target.kind === 'repo') {
                    expect(fs.existsSync(path.join(process.cwd(), target.path)), label).toBe(true);
                    continue;
                }
                const targetFile = target.kind === 'index'
                    ? 'README.md'
                    : target.kind === 'guide'
                        ? DOC_PAGES.find((page) => page.slug === target.slug)!.file
                        : `${MANUAL_DIR}/${target.slug}.md`;
                if (target.hash) {
                    expect(byTarget.get(targetFile)?.has(target.hash.slice(1)), label).toBe(true);
                }
            }
        }
    });
});
