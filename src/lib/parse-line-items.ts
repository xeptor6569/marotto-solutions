import type { LineItem } from '@/lib/types';

/** Parse `items[n][field]` from a document form submission (Server Action FormData). */
export function parseLineItemsFromFormData(formData: FormData): LineItem[] {
    const byIndex = new Map<number, {
        id?: string;
        description?: string;
        details?: string;
        quantity?: number;
        unitPrice?: number;
        pending?: string;
    }>();

    for (const [key, value] of formData.entries()) {
        if (typeof value !== 'string') continue;
        const match = key.match(/^items\[(\d+)\]\[(\w+)\]$/);
        if (!match) continue;
        const index = Number(match[1]);
        const field = match[2];
        const row = byIndex.get(index) ?? {};
        switch (field) {
            case 'id':
                row.id = value;
                break;
            case 'description':
                row.description = value;
                break;
            case 'details':
                row.details = value;
                break;
            case 'quantity':
                row.quantity = Number(value);
                break;
            case 'unitPrice':
                row.unitPrice = Number(value);
                break;
            case 'pendingClientApproval':
                row.pending = value;
                break;
            default:
                break;
        }
        byIndex.set(index, row);
    }

    return [...byIndex.keys()]
        .sort((a, b) => a - b)
        .map((index) => {
            const row = byIndex.get(index)!;
            const qty = Number.isFinite(row.quantity) ? Number(row.quantity) : 0;
            const unitPrice = Number.isFinite(row.unitPrice) ? Number(row.unitPrice) : 0;
            const pendingClientApproval = row.pending === '1' || row.pending === 'on';
            return {
                id: row.id?.trim() || crypto.randomUUID(),
                description: row.description ?? '',
                details: row.details ?? '',
                quantity: qty,
                unitPrice,
                total: qty * unitPrice,
                ...(pendingClientApproval ? { pendingClientApproval: true as const } : {}),
            };
        });
}
