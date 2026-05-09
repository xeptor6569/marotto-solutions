import type { LineItem } from '@/lib/types';

export function pendingApprovalLineTotal(lineItems: LineItem[]): number {
    return lineItems.filter((i) => i.pendingClientApproval).reduce((sum, i) => sum + i.total, 0);
}

export function hasPendingApprovalLines(lineItems: LineItem[]): boolean {
    return lineItems.some((i) => i.pendingClientApproval);
}

export function agreedScopeLineTotal(lineItems: LineItem[]): number {
    return lineItems.filter((i) => !i.pendingClientApproval).reduce((sum, i) => sum + i.total, 0);
}

/** Single paragraph for email/mailto when any line awaits approval. */
export function pendingApprovalSummarySentence(docTitle: string, pendingTotal: number): string {
    const label = docTitle.toLowerCase();
    return `This ${label} includes additional scope totaling $${pendingTotal.toFixed(2)} pending your approval. Please review the full breakdown at the link below.`;
}
