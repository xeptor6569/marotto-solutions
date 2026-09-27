import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DOC_PAGES, DOCS_REPO_URL, isDocsHost, parseDoc, rewriteDocHref, slugifyHeading } from '@/lib/docs';

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

describe('guides', () => {
    const docsDir = path.join(process.cwd(), 'docs');

    it('every registered guide exists and has a title', () => {
        for (const page of DOC_PAGES) {
            const doc = parseDoc(fs.readFileSync(path.join(docsDir, page.file), 'utf-8'));
            expect(doc.title, page.file).not.toBe('');
        }
    });

    it('cross-links between guides point at headings that exist', () => {
        const anchors = new Map(
            DOC_PAGES.map((page) => {
                const md = fs.readFileSync(path.join(docsDir, page.file), 'utf-8');
                const ids = [...md.matchAll(/^#{2,4} (.+)$/gm)].map((m) => slugifyHeading(m[1].replace(/`/g, '')));
                return [page.file, new Set(ids)];
            }),
        );
        for (const page of DOC_PAGES) {
            const md = fs.readFileSync(path.join(docsDir, page.file), 'utf-8');
            for (const [, file, hash] of md.matchAll(/\]\(([a-z-]+\.md)#([^)]+)\)/g)) {
                expect(anchors.get(file)?.has(hash), `${page.file} → ${file}#${hash}`).toBe(true);
            }
        }
    });
});
