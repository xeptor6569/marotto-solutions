import type {
    DocumentData,
    DocumentPreset,
    DocumentPresetInput,
    LineItem,
    PresetDocumentType,
} from './types';

export const PRESET_DOCUMENT_TYPES: PresetDocumentType[] = [
    'invoice',
    'estimate',
    'quote',
    'receipt',
];

export function isPresetDocumentType(value: unknown): value is PresetDocumentType {
    return typeof value === 'string' && (PRESET_DOCUMENT_TYPES as string[]).includes(value);
}

function normalizeLineItem(raw: Partial<LineItem> | null | undefined, fallbackId: string): LineItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const description = typeof raw.description === 'string' ? raw.description : '';
    const quantity = Number(raw.quantity);
    const unitPrice = Number(raw.unitPrice);
    const discountPercent = raw.discountPercent != null ? Number(raw.discountPercent) : undefined;
    const qty = Number.isFinite(quantity) ? quantity : 1;
    const price = Number.isFinite(unitPrice) ? unitPrice : 0;
    const disc = discountPercent != null && Number.isFinite(discountPercent)
        ? Math.min(100, Math.max(0, discountPercent))
        : undefined;
    const gross = qty * price;
    const total = disc != null ? gross * (1 - disc / 100) : (Number.isFinite(Number(raw.total)) ? Number(raw.total) : gross);

    return {
        id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : fallbackId,
        description,
        details: typeof raw.details === 'string' ? raw.details : undefined,
        quantity: qty,
        unitPrice: price,
        total,
        ...(disc != null && disc > 0 ? { discountPercent: disc } : {}),
        ...(raw.pendingClientApproval ? { pendingClientApproval: true } : {}),
    };
}

export function normalizePreset(raw: unknown): DocumentPreset | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name.trim() : '';
    if (!name) return null;

    const id = typeof obj.id === 'string' && obj.id.trim()
        ? obj.id.trim()
        : crypto.randomUUID();
    const rawTypes = Array.isArray(obj.documentTypes) ? obj.documentTypes : [];
    const documentTypes = rawTypes.filter(isPresetDocumentType);
    const rawItems = Array.isArray(obj.lineItems) ? obj.lineItems : [];
    const lineItems = rawItems
        .map((item, index) => normalizeLineItem(item as Partial<LineItem>, `item-${index + 1}`))
        .filter((item): item is LineItem => item != null);

    const now = new Date().toISOString();
    return {
        id,
        name,
        documentTypes,
        title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : undefined,
        notes: typeof obj.notes === 'string' ? obj.notes : undefined,
        lineItems,
        createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : now,
    };
}

export function normalizePresetsFile(raw: unknown): DocumentPreset[] {
    if (!raw) return [];
    const list = Array.isArray(raw)
        ? raw
        : (raw && typeof raw === 'object' && Array.isArray((raw as { presets?: unknown }).presets)
            ? (raw as { presets: unknown[] }).presets
            : []);
    const seen = new Set<string>();
    const presets: DocumentPreset[] = [];
    for (const entry of list) {
        const preset = normalizePreset(entry);
        if (!preset || seen.has(preset.id)) continue;
        seen.add(preset.id);
        presets.push(preset);
    }
    return presets.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function presetMatchesDocumentType(
    preset: DocumentPreset,
    type: PresetDocumentType,
): boolean {
    if (!preset.documentTypes.length) return true;
    return preset.documentTypes.includes(type);
}

/** Clone line items with fresh ids so applying a preset never reuses stored ids. */
export function applyPresetLineItems(preset: DocumentPreset): LineItem[] {
    if (!preset.lineItems.length) {
        return [{
            id: crypto.randomUUID(),
            description: 'Service',
            details: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
            pendingClientApproval: false,
        }];
    }
    return preset.lineItems.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        details: item.details ?? '',
    }));
}

export function buildPresetFromDocument(
    doc: Pick<DocumentData, 'type' | 'title' | 'notes' | 'lineItems'>,
    name: string,
): DocumentPresetInput {
    const documentTypes: PresetDocumentType[] = isPresetDocumentType(doc.type) ? [doc.type] : [];
    return {
        name: name.trim(),
        documentTypes,
        title: doc.title?.trim() || undefined,
        notes: doc.notes || undefined,
        lineItems: (doc.lineItems || []).map((item) => ({
            ...item,
            id: crypto.randomUUID(),
            details: item.details ?? '',
        })),
    };
}
