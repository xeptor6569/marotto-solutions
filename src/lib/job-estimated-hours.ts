import type { DocumentData } from '@/lib/types';

export interface JobEstimatedHoursContribution {
    documentId: string;
    type: 'estimate' | 'quote';
    title?: string;
    estimatedHours: number;
    status: DocumentData['status'];
}

export interface JobEstimatedHoursSummary {
    totalHours: number;
    contributions: JobEstimatedHoursContribution[];
}

function hasFiniteHours(doc: DocumentData): doc is DocumentData & { estimatedHours: number } {
    return typeof doc.estimatedHours === 'number' && Number.isFinite(doc.estimatedHours) && doc.estimatedHours > 0;
}

function sourceDocumentIds(doc: DocumentData): string[] {
    return (doc.tags || [])
        .filter((tag) => tag.startsWith('source:'))
        .map((tag) => tag.slice('source:'.length).trim())
        .filter(Boolean);
}

/**
 * Aggregate estimated hours from linked estimates/quotes.
 * Quotes take precedence: estimates that were converted into a linked quote
 * (via `source:EST-…` tags) are excluded to avoid double-counting.
 */
export function aggregateJobEstimatedHours(
    estimates: DocumentData[],
    quotes: DocumentData[],
): JobEstimatedHoursSummary {
    const activeQuotes = quotes.filter((doc) => doc.type === 'quote' && doc.status !== 'void');
    const activeEstimates = estimates.filter((doc) => doc.type === 'estimate' && doc.status !== 'void');

    const supersededEstimateIds = new Set<string>();
    for (const quote of activeQuotes) {
        for (const sourceId of sourceDocumentIds(quote)) {
            supersededEstimateIds.add(sourceId);
        }
    }

    const contributions: JobEstimatedHoursContribution[] = [];

    for (const quote of activeQuotes) {
        if (!hasFiniteHours(quote)) continue;
        contributions.push({
            documentId: quote.id,
            type: 'quote',
            title: quote.title,
            estimatedHours: quote.estimatedHours,
            status: quote.status,
        });
    }

    for (const estimate of activeEstimates) {
        if (supersededEstimateIds.has(estimate.id)) continue;
        if (!hasFiniteHours(estimate)) continue;
        contributions.push({
            documentId: estimate.id,
            type: 'estimate',
            title: estimate.title,
            estimatedHours: estimate.estimatedHours,
            status: estimate.status,
        });
    }

    const totalHours = Math.round(
        contributions.reduce((sum, item) => sum + item.estimatedHours, 0) * 100,
    ) / 100;

    return { totalHours, contributions };
}

/** Parse a form hours field; empty/invalid → undefined. */
export function parseEstimatedHours(raw: FormDataEntryValue | null | undefined): number | undefined {
    if (raw == null) return undefined;
    const text = String(raw).trim();
    if (!text) return undefined;
    const n = Number(text);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.round(n * 100) / 100;
}

export function formatHours(hours: number): string {
    const safe = Number.isFinite(hours) ? hours : 0;
    const rounded = Math.round(safe * 100) / 100;
    const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
    return `${label} hr${rounded === 1 ? '' : 's'}`;
}
