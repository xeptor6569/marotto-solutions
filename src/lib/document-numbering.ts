import type { DocumentNumberingConfig, DocumentType, NumberedDocumentType } from './types';

/**
 * Document ID scheme: `${prefix}-${zero-padded number}` per type. Prefixes and
 * starting numbers are business settings (Settings → Documents) so a new
 * install can start at INV-0001 while an existing one keeps its sequence.
 * Numbers only ever move forward; the start number applies when a type has
 * no documents yet.
 */

export const NUMBERED_DOCUMENT_TYPES: NumberedDocumentType[] = ['invoice', 'estimate', 'quote', 'receipt'];

export const DEFAULT_PREFIXES: Record<NumberedDocumentType, string> = {
    invoice: 'INV',
    estimate: 'EST',
    quote: 'QTE',
    receipt: 'RCT',
};

export const DEFAULT_START_NUMBERS: Record<NumberedDocumentType, number> = {
    invoice: 1,
    estimate: 1,
    quote: 1,
    receipt: 1,
};

export const DEFAULT_NUMBER_PADDING = 4;

/** Leads keep a fixed prefix; they are an intake record, not a numbered business document. */
const LEAD_PREFIX = 'LEAD';

export interface ResolvedNumbering {
    prefixes: Record<NumberedDocumentType, string>;
    startNumbers: Record<NumberedDocumentType, number>;
    padding: number;
}

export const DEFAULT_NUMBERING: ResolvedNumbering = {
    prefixes: DEFAULT_PREFIXES,
    startNumbers: DEFAULT_START_NUMBERS,
    padding: DEFAULT_NUMBER_PADDING,
};

/** Upper-case letters/digits only, 1–8 chars; anything else falls back to the default. */
export function sanitizePrefix(raw: unknown, fallback: string): string {
    if (typeof raw !== 'string') return fallback;
    const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    return cleaned || fallback;
}

export function sanitizeStartNumber(raw: unknown, fallback: number): number {
    const value = typeof raw === 'string' ? Number(raw) : raw;
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(999_999_999, Math.max(1, Math.floor(value)));
}

export function resolveNumbering(config: DocumentNumberingConfig | undefined): ResolvedNumbering {
    const prefixes = { ...DEFAULT_PREFIXES };
    const startNumbers = { ...DEFAULT_START_NUMBERS };
    for (const type of NUMBERED_DOCUMENT_TYPES) {
        prefixes[type] = sanitizePrefix(config?.prefixes?.[type], DEFAULT_PREFIXES[type]);
        startNumbers[type] = sanitizeStartNumber(config?.startNumbers?.[type], DEFAULT_START_NUMBERS[type]);
    }
    const paddingRaw = Number(config?.padding);
    const padding = Number.isFinite(paddingRaw) ? Math.min(8, Math.max(3, Math.floor(paddingRaw))) : DEFAULT_NUMBER_PADDING;
    return { prefixes, startNumbers, padding };
}

export function buildDocumentId(
    type: DocumentType,
    number: number,
    numbering: ResolvedNumbering = DEFAULT_NUMBERING,
): string {
    const prefix = type === 'lead' ? LEAD_PREFIX : numbering.prefixes[type];
    return `${prefix}-${String(number).padStart(numbering.padding, '0')}`;
}

export async function getDocumentNumbering(): Promise<ResolvedNumbering> {
    // Lazy import: config.ts uses the defaults above, so a static import would
    // create a module cycle.
    const { getAppConfig } = await import('./config');
    const config = await getAppConfig();
    return resolveNumbering(config.numbering);
}
