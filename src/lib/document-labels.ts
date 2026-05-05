import type { DocumentData } from './types';

export const DOC_LABEL: Record<DocumentData['type'], string> = {
    invoice: 'Invoice',
    estimate: 'Estimate',
    quote: 'Quote',
    receipt: 'Receipt',
    lead: 'Client',
};
