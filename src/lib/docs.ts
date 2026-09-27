/**
 * Public documentation site: the self-hoster guides in `docs/*.md` plus the
 * user manual in `docs/manual/*.md`, served at `/docs` on every install and at
 * the root of any `docs.*` hostname (or the host named by DOCS_HOST). Pure
 * helpers only — file reading lives in docs-server.ts so this module stays
 * importable from client components.
 */

import { HELP_TOPICS, helpTopicFile, MANUAL_DIR } from './help-content';

/** Directory under `docs/` a markdown file lives in; relative links resolve from it. */
export type DocDir = '' | typeof MANUAL_DIR;

export const DOCS_REPO_URL = 'https://github.com/xeptor6569/marotto-solutions';

export type DocIcon = 'rocket' | 'sliders' | 'globe' | 'archive' | 'lifeBuoy';

export interface DocPage {
    slug: string;
    file: string;
    title: string;
    description: string;
    icon: DocIcon;
}

export const DOC_PAGES: DocPage[] = [
    {
        slug: 'getting-started',
        file: 'getting-started.md',
        title: 'Getting started',
        description: 'Install the app, run the setup wizard, and make it yours.',
        icon: 'rocket',
    },
    {
        slug: 'configuration',
        file: 'configuration.md',
        title: 'Configuration',
        description: 'Every environment variable and Settings tab, explained.',
        icon: 'sliders',
    },
    {
        slug: 'deployment',
        file: 'deployment.md',
        title: 'Deploying to production',
        description: 'Your own domain with HTTPS, email, card payments, and scheduled jobs.',
        icon: 'globe',
    },
    {
        slug: 'operations',
        file: 'operations.md',
        title: 'Backups & upgrades',
        description: 'Protect your data, move servers, and install new versions.',
        icon: 'archive',
    },
    {
        slug: 'troubleshooting',
        file: 'troubleshooting.md',
        title: 'Troubleshooting',
        description: 'Fixes for the most common installation and day-to-day problems.',
        icon: 'lifeBuoy',
    },
];

export function getDocPage(slug: string): DocPage | undefined {
    return DOC_PAGES.find((page) => page.slug === slug);
}

/** Hostname (no port, lowercase) from a Host / X-Forwarded-Host value. */
function hostnameOf(value: string | null | undefined): string {
    const first = (value || '').split(',')[0].trim().toLowerCase();
    return first.replace(/^[a-z]+:\/\//, '').split('/')[0].replace(/:\d+$/, '');
}

export function isDocsHost(host: string | null | undefined, docsHostSetting = process.env.DOCS_HOST): boolean {
    const hostname = hostnameOf(host);
    if (!hostname) return false;
    const configured = hostnameOf(docsHostSetting);
    return configured ? hostname === configured : hostname.startsWith('docs.');
}

/** Path prefix for docs links: empty on the docs host, `/docs` everywhere else. */
export function docsBasePath(onDocsHost: boolean): string {
    return onDocsHost ? '' : '/docs';
}

export function docsHref(base: string, slug?: string, hash = ''): string {
    const path = slug ? `${base}/${slug}` : base || '/';
    return `${path}${hash}`;
}

/** GitHub-compatible heading anchor, so `file.md#some-heading` links keep working. */
export function slugifyHeading(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s/g, '-');
}

export function manualHref(base: string, slug: string, hash = ''): string {
    return docsHref(base, `${MANUAL_DIR}/${slug}`, hash);
}

export type DocLinkTarget =
    | { kind: 'external'; href: string }
    | { kind: 'index'; hash: string }
    | { kind: 'guide'; slug: string; hash: string }
    | { kind: 'manual'; slug: string; hash: string }
    | { kind: 'repo'; path: string; hash: string };

/**
 * Classifies a link written for GitHub (relative `.md` paths) from a file in
 * `docs/` (`fromDir` '') or `docs/manual/` (`fromDir` 'manual').
 */
export function resolveDocLink(href: string, fromDir: DocDir = ''): DocLinkTarget {
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/')) {
        return { kind: 'external', href };
    }
    const [pathPart, hashPart] = href.split('#', 2);
    const hash = hashPart !== undefined ? `#${hashPart}` : '';

    const segments: string[] = fromDir ? [fromDir] : [];
    let escaped = 0;
    for (const segment of pathPart.split('/')) {
        if (segment === '' || segment === '.') continue;
        if (segment === '..') {
            if (segments.length > 0) segments.pop();
            else escaped += 1;
        } else {
            segments.push(segment);
        }
    }
    const resolved = segments.join('/');

    if (escaped > 0) return { kind: 'repo', path: resolved, hash };
    if (resolved === '' || resolved === 'README.md') return { kind: 'index', hash };
    const page = DOC_PAGES.find((p) => p.file === resolved);
    if (page) return { kind: 'guide', slug: page.slug, hash };
    const manual = HELP_TOPICS.find((topic) => helpTopicFile(topic) === resolved);
    if (manual) return { kind: 'manual', slug: manual.slug, hash };
    return { kind: 'repo', path: `docs/${resolved}`, hash };
}

function repoUrl(path: string, hash: string): string {
    return `${DOCS_REPO_URL}/blob/main/${path}${hash}`;
}

/**
 * Maps links written for GitHub onto the docs site: guides and manual pages
 * become site routes, the docs index becomes the site root, and anything else
 * in the repo points at GitHub.
 */
export function rewriteDocHref(href: string, base: string, fromDir: DocDir = ''): string {
    const target = resolveDocLink(href, fromDir);
    switch (target.kind) {
        case 'external': return target.href;
        case 'index': return docsHref(base, undefined, target.hash);
        case 'guide': return docsHref(base, target.slug, target.hash);
        case 'manual': return manualHref(base, target.slug, target.hash);
        case 'repo': return repoUrl(target.path, target.hash);
    }
}

/**
 * Same links as seen from the in-app Help: manual pages stay in the app, and
 * the self-hosting guides open on this install's `/docs` site.
 */
export function rewriteHelpHref(href: string): string {
    const target = resolveDocLink(href, MANUAL_DIR);
    switch (target.kind) {
        case 'external': return target.href;
        case 'index': return docsHref('/docs', undefined, target.hash);
        case 'guide': return docsHref('/docs', target.slug, target.hash);
        case 'manual': return `/admin/help/${target.slug}${target.hash}`;
        case 'repo': return repoUrl(target.path, target.hash);
    }
}

export interface DocHeading {
    id: string;
    text: string;
}

/** Strips inline markdown so heading text matches what is rendered. */
function plainHeadingText(raw: string): string {
    return raw
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*([^*]*)\*\*/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .trim();
}

/** Title (first `# `), body without it, and `## ` headings for the page outline. */
export function parseDoc(markdown: string): { title: string; body: string; headings: DocHeading[] } {
    const lines = markdown.split('\n');
    let title = '';
    const body: string[] = [];
    const headings: DocHeading[] = [];
    let inFence = false;

    for (const line of lines) {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
        if (!inFence && !title && /^# /.test(line)) {
            title = plainHeadingText(line.slice(2));
            continue;
        }
        if (!inFence && /^## /.test(line)) {
            const text = plainHeadingText(line.slice(3));
            headings.push({ id: slugifyHeading(text), text });
        }
        body.push(line);
    }
    return { title, body: body.join('\n').replace(/^\n+/, ''), headings };
}
