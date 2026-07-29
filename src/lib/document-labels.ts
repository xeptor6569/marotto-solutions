import type { DocumentData, LineItem } from './types';

export const DOC_LABEL: Record<DocumentData['type'], string> = {
    invoice: 'Invoice',
    estimate: 'Estimate',
    quote: 'Quote',
    receipt: 'Receipt',
    lead: 'Client',
};

/** Short label used in dashboards and lists: "#{n} — Title" or "#{n} — Customer". */
export function documentListLabel(doc: Pick<DocumentData, 'number' | 'title' | 'customer'>): string {
    const identity = (doc.title || '').trim() || (doc.customer?.name || '').trim() || 'Untitled';
    return `#${doc.number} — ${identity}`;
}

/** Secondary line under the list label (customer when a title is already the primary identity). */
export function documentListSubLabel(doc: Pick<DocumentData, 'title' | 'customer'>): string | undefined {
    const title = (doc.title || '').trim();
    const customer = (doc.customer?.name || '').trim();
    if (title && customer) return customer;
    return undefined;
}

/**
 * Suggest a document title when the user left it blank.
 * Prefers the first meaningful line-item description; appends "+N more" when there are extras.
 */
export function suggestDocumentTitle(
    lineItems: Pick<LineItem, 'description'>[],
    fallback?: string | null,
): string | undefined {
    const descriptions = lineItems
        .map((item) => (item.description || '').trim())
        .filter((text) => text && text.toLowerCase() !== 'service');

    if (descriptions.length > 0) {
        const first = descriptions[0];
        const extra = descriptions.length - 1;
        return extra > 0 ? `${first} +${extra} more` : first;
    }

    const fromFallback = (fallback || '').trim();
    return fromFallback || undefined;
}
