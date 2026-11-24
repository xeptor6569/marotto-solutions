import { documentListLabel, documentListSubLabel } from '@/lib/document-labels';
import { documentStatusDisplay, statusDisplay } from '@/lib/status-display';
import type { DocumentData } from '@/lib/types';

/**
 * Shared admin search: multi-word AND, light typo tolerance, and phone digits.
 * List pages use {@link matchesSmartQuery}. The global dialog ranks with
 * {@link scoreSmartQuery}.
 */

export type SmartFieldKind = 'text' | 'phone' | 'identity';

export interface SmartField {
    value: string;
    /** `identity` is an id or number (exact query match ranks first). `phone` accepts digit-only matches. */
    kind?: SmartFieldKind;
}

export type SmartFieldInput = string | null | undefined | SmartField;

const SCORE = {
    identity: 1000,
    word: 100,
    prefix: 80,
    substring: 60,
    phone: 50,
    typo: 30,
} as const;

/** How many ranked rows the global dialog shows. */
export const ADMIN_SEARCH_RESULT_LIMIT = 20;

const PHONE_TOKEN = /^[\d+().-]+$/;
const PHONE_PUNCTUATION = /[^\d]/g;

export type AdminSearchKind = 'client' | 'job' | 'invoice' | 'estimate' | 'quote' | 'receipt' | 'contract';

export const ADMIN_SEARCH_KIND_LABEL: Record<AdminSearchKind, string> = {
    client: 'Client',
    job: 'Job',
    invoice: 'Invoice',
    estimate: 'Estimate',
    quote: 'Quote',
    receipt: 'Receipt',
    contract: 'Contract',
};

export interface AdminSearchHit {
    kind: AdminSearchKind;
    id: string;
    href: string;
    title: string;
    subtitle: string;
    fields: SmartField[];
}

interface NormalizedField {
    value: string;
    kind: SmartFieldKind;
    words: string[];
    digits: string;
}

export function normalizeSearchText(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function coerceField(input: SmartFieldInput): SmartField {
    if (typeof input === 'string' || input == null) return { value: input ?? '' };
    return input;
}

function tokenize(query: string): string[] {
    const normalized = normalizeSearchText(query);
    return normalized ? normalized.split(' ') : [];
}

function normalizeField(input: SmartFieldInput): NormalizedField | null {
    const field = coerceField(input);
    const value = normalizeSearchText(field.value);
    if (!value) return null;
    const kind = field.kind ?? 'text';
    return {
        value,
        kind,
        words: value.split(/[^a-z0-9]+/).filter(Boolean),
        digits: kind === 'phone' ? value.replace(PHONE_PUNCTUATION, '') : '',
    };
}

function isPhoneToken(token: string): boolean {
    if (!PHONE_TOKEN.test(token)) return false;
    return token.replace(PHONE_PUNCTUATION, '').length >= 3;
}

function maxTypoDistance(token: string): number {
    if (token.length >= 8) return 2;
    if (token.length >= 4) return 1;
    return 0;
}

/** True when `a` and `b` differ by at most `max` edits. Length is checked by the caller. */
function withinEditDistance(a: string, b: string, max: number): boolean {
    if (Math.abs(a.length - b.length) > max) return false;
    let prev = Array.from({ length: b.length + 1 }, (_, index) => index);
    let curr = new Array<number>(b.length + 1);
    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        let rowMin = curr[0];
        const aChar = a.charCodeAt(i - 1);
        for (let j = 1; j <= b.length; j++) {
            const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
            if (curr[j] < rowMin) rowMin = curr[j];
        }
        if (rowMin > max) return false;
        const swap = prev;
        prev = curr;
        curr = swap;
    }
    return prev[b.length] <= max;
}

function literalScore(token: string, field: NormalizedField): number {
    let best = 0;
    if (field.value.includes(token)) {
        const exactWord = field.words.some((word) => word === token);
        const prefix = field.words.some((word) => word !== token && word.startsWith(token));
        best = exactWord ? SCORE.word : prefix ? SCORE.prefix : SCORE.substring;
    }
    if (field.kind === 'phone' && field.digits && isPhoneToken(token)) {
        const tokenDigits = token.replace(PHONE_PUNCTUATION, '');
        if (tokenDigits && field.digits.includes(tokenDigits)) {
            best = Math.max(best, SCORE.phone);
        }
    }
    return best;
}

function tokenScore(token: string, fields: NormalizedField[]): number {
    let best = 0;
    for (const field of fields) {
        const score = literalScore(token, field);
        if (score > best) best = score;
    }
    if (best > 0) return best;
    const max = maxTypoDistance(token);
    if (max === 0 || !/[a-z]/.test(token)) return 0;
    for (const field of fields) {
        for (const word of field.words) {
            if (!/[a-z]/.test(word)) continue;
            if (withinEditDistance(token, word, max)) return SCORE.typo;
        }
    }
    return 0;
}

function prepared(fields: SmartFieldInput[]): NormalizedField[] {
    const normalized: NormalizedField[] = [];
    for (const field of fields) {
        const next = normalizeField(field);
        if (next) normalized.push(next);
    }
    return normalized;
}

/** Empty queries match every row, which is how the list filters behave today. */
export function matchesSmartQuery(query: string, fields: SmartFieldInput[]): boolean {
    const tokens = tokenize(query);
    if (tokens.length === 0) return true;
    const normalized = prepared(fields);
    return tokens.every((token) => tokenScore(token, normalized) > 0);
}

/**
 * 0 when any token misses. Otherwise the sum of each token's best score, plus
 * a bonus when the whole query is exactly an id or number.
 */
export function scoreSmartQuery(query: string, fields: SmartFieldInput[]): number {
    const tokens = tokenize(query);
    if (tokens.length === 0) return 0;
    const normalized = prepared(fields);
    let total = 0;
    for (const token of tokens) {
        const score = tokenScore(token, normalized);
        if (score === 0) return 0;
        total += score;
    }
    const queryText = tokens.join(' ');
    if (normalized.some((field) => field.kind === 'identity' && field.value === queryText)) {
        total += SCORE.identity;
    }
    return total;
}

export function rankAdminSearchHits(
    query: string,
    hits: AdminSearchHit[],
    limit = ADMIN_SEARCH_RESULT_LIMIT,
): AdminSearchHit[] {
    const ranked: { hit: AdminSearchHit; score: number }[] = [];
    for (const hit of hits) {
        const score = scoreSmartQuery(query, hit.fields);
        if (score > 0) ranked.push({ hit, score });
    }
    ranked.sort((a, b) => b.score - a.score || a.hit.title.localeCompare(b.hit.title) || a.hit.id.localeCompare(b.hit.id));
    return ranked.slice(0, limit).map((entry) => entry.hit);
}

function compact(fields: SmartField[]): SmartField[] {
    return fields.filter((field) => field.value.trim() !== '');
}

function lineItemFields(items: { description?: string | null; details?: string | null }[] | undefined): SmartField[] {
    const fields: SmartField[] = [];
    for (const item of items ?? []) {
        if (item.description) fields.push({ value: item.description });
        if (item.details) fields.push({ value: item.details });
    }
    return fields;
}

/** Text the document lists and the global dialog both search, with id and number kept as identity. */
export function documentSmartFields(doc: Pick<
    DocumentData,
    'id' | 'number' | 'title' | 'notes' | 'customer' | 'lineItems' | 'packages' | 'choiceGroups'
>): SmartField[] {
    const customer = doc.customer;
    return compact([
        { value: doc.id, kind: 'identity' },
        { value: String(doc.number), kind: 'identity' },
        { value: doc.title ?? '' },
        { value: doc.notes ?? '' },
        { value: customer?.name ?? '' },
        { value: customer?.email ?? '' },
        { value: customer?.address ?? '' },
        { value: customer?.phone ?? '', kind: 'phone' },
        ...lineItemFields(doc.lineItems),
        ...(doc.packages ?? []).flatMap((pkg) => lineItemFields(pkg.lineItems)),
        ...(doc.choiceGroups ?? []).flatMap((group) => group.choices.flatMap((choice) => lineItemFields(choice.lineItems))),
    ]);
}

const DOCUMENT_PATH: Record<'invoice' | 'estimate' | 'quote' | 'receipt', string> = {
    invoice: 'invoices',
    estimate: 'estimates',
    quote: 'quotes',
    receipt: 'receipts',
};

export interface ClientSearchRecord {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isProspect: boolean;
}

export function clientSearchHit(client: ClientSearchRecord): AdminSearchHit {
    const subtitle = [
        client.isProspect ? 'Prospect' : null,
        client.email,
        client.phone,
    ].filter(Boolean).join(' · ');
    return {
        kind: 'client',
        id: client.id,
        href: `/admin/clients?client=${encodeURIComponent(client.id)}`,
        title: client.name,
        subtitle,
        fields: compact([
            { value: client.id, kind: 'identity' },
            { value: client.name },
            { value: client.email ?? '' },
            { value: client.phone ?? '', kind: 'phone' },
            { value: client.address ?? '' },
            { value: client.notes ?? '' },
        ]),
    };
}

export interface JobSearchRecord {
    id: string;
    name: string;
    description: string | null;
    status: string;
    clientName: string | null;
}

export function jobSearchHit(job: JobSearchRecord): AdminSearchHit {
    const subtitle = [job.clientName, statusDisplay('job', job.status).label].filter(Boolean).join(' · ');
    return {
        kind: 'job',
        id: job.id,
        href: `/admin/jobs/${encodeURIComponent(job.id)}`,
        title: job.name,
        subtitle,
        fields: compact([
            { value: job.id, kind: 'identity' },
            { value: job.name },
            { value: job.description ?? '' },
            { value: job.status },
            { value: job.clientName ?? '' },
        ]),
    };
}

export interface ContractSearchRecord {
    id: string;
    number: number;
    displayId: string;
    title: string;
    status: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    lines: { description: string; details: string | null }[];
}

export function contractSearchHit(contract: ContractSearchRecord): AdminSearchHit {
    const subtitle = [
        contract.displayId,
        contract.customerName,
        statusDisplay('contract', contract.status).label,
    ].filter(Boolean).join(' · ');
    return {
        kind: 'contract',
        id: contract.id,
        href: `/admin/contracts/${encodeURIComponent(contract.id)}`,
        title: contract.title,
        subtitle,
        fields: compact([
            { value: contract.id, kind: 'identity' },
            { value: contract.displayId, kind: 'identity' },
            { value: String(contract.number), kind: 'identity' },
            { value: contract.title },
            { value: contract.customerName },
            { value: contract.customerEmail ?? '' },
            { value: contract.customerPhone ?? '', kind: 'phone' },
            ...lineItemFields(contract.lines),
        ]),
    };
}

export function documentSearchHit(doc: DocumentData): AdminSearchHit {
    const kind = doc.type === 'lead' ? 'client' : doc.type;
    const path = doc.type === 'lead' ? null : DOCUMENT_PATH[doc.type];
    const subtitle = [documentStatusDisplay(doc).label, documentListSubLabel(doc)].filter(Boolean).join(' · ');
    return {
        kind,
        id: doc.id,
        href: path ? `/admin/${path}/${encodeURIComponent(doc.id)}` : `/admin/clients`,
        title: documentListLabel(doc),
        subtitle,
        fields: documentSmartFields(doc),
    };
}
