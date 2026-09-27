import type { LineItem } from '@/lib/types';
import { DEFAULT_MONEY_FORMAT, formatMoney, type MoneyFormat } from './money';

function normalizeLineItems(lineItems: LineItem[] | null | undefined): LineItem[] {
    return Array.isArray(lineItems) ? lineItems : [];
}

export function pendingApprovalLineTotal(lineItems: LineItem[] | null | undefined): number {
    return normalizeLineItems(lineItems)
        .filter((i) => i.pendingClientApproval)
        .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
}

export function hasPendingApprovalLines(lineItems: LineItem[] | null | undefined): boolean {
    return normalizeLineItems(lineItems).some((i) => i.pendingClientApproval);
}

export function agreedScopeLineTotal(lineItems: LineItem[] | null | undefined): number {
    return normalizeLineItems(lineItems)
        .filter((i) => !i.pendingClientApproval)
        .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
}

/** Single paragraph for email/mailto when any line awaits approval. */
export function pendingApprovalSummarySentence(
    docTitle: string,
    pendingTotal: number,
    moneyFormat: MoneyFormat = DEFAULT_MONEY_FORMAT,
): string {
    const label = docTitle.toLowerCase();
    const money = (amount: number) => formatMoney(amount, moneyFormat);
    return `This ${label} includes additional scope totaling ${money(pendingTotal)} pending your approval. Please review the full breakdown at the link below.`;
}
