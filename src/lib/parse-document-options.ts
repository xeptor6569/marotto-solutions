import type {
    DocumentChoice,
    DocumentChoiceGroup,
    DocumentPackage,
    LineItem,
} from '@/lib/types';

type RawLineRow = {
    id?: string;
    description?: string;
    details?: string;
    quantity?: number;
    unitPrice?: number;
    discountPercent?: number;
    pending?: string;
};

type RawPackage = {
    id?: string;
    label?: string;
    description?: string;
    recommended?: string;
    items: Map<number, RawLineRow>;
};

type RawChoice = {
    id?: string;
    label?: string;
    description?: string;
    items: Map<number, RawLineRow>;
};

type RawChoiceGroup = {
    id?: string;
    label?: string;
    description?: string;
    required?: string;
    choices: Map<number, RawChoice>;
};

function finalizeLineItem(row: RawLineRow): LineItem {
    const qty = Number.isFinite(row.quantity) ? Number(row.quantity) : 0;
    const unitPrice = Number.isFinite(row.unitPrice) ? Number(row.unitPrice) : 0;
    const rawDiscount = Number.isFinite(row.discountPercent) ? Number(row.discountPercent) : 0;
    const discountPercent = Math.min(100, Math.max(0, rawDiscount));
    const gross = qty * unitPrice;
    const total = gross * (1 - discountPercent / 100);
    const pendingClientApproval = row.pending === '1' || row.pending === 'on';
    return {
        id: row.id?.trim() || crypto.randomUUID(),
        description: row.description ?? '',
        details: row.details ?? '',
        quantity: qty,
        unitPrice,
        total,
        ...(discountPercent > 0 ? { discountPercent } : {}),
        ...(pendingClientApproval ? { pendingClientApproval: true as const } : {}),
    };
}

function applyLineField(row: RawLineRow, field: string, value: string): void {
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
        case 'discountPercent':
            row.discountPercent = Number(value);
            break;
        case 'pendingClientApproval':
            row.pending = value;
            break;
        default:
            break;
    }
}

function sortedMapValues<T>(map: Map<number, T>): T[] {
    return [...map.keys()]
        .sort((a, b) => a - b)
        .map((key) => map.get(key)!);
}

/**
 * Parse packages[i][…] and packages[i][items][j][…] from FormData.
 */
export function parsePackagesFromFormData(formData: FormData): DocumentPackage[] {
    const packages = new Map<number, RawPackage>();

    for (const [key, value] of formData.entries()) {
        if (typeof value !== 'string') continue;

        const itemMatch = key.match(/^packages\[(\d+)\]\[items\]\[(\d+)\]\[(\w+)\]$/);
        if (itemMatch) {
            const pkgIndex = Number(itemMatch[1]);
            const itemIndex = Number(itemMatch[2]);
            const field = itemMatch[3];
            const pkg: RawPackage = packages.get(pkgIndex) ?? { items: new Map() };
            const row = pkg.items.get(itemIndex) ?? {};
            applyLineField(row, field, value);
            pkg.items.set(itemIndex, row);
            packages.set(pkgIndex, pkg);
            continue;
        }

        const fieldMatch = key.match(/^packages\[(\d+)\]\[(\w+)\]$/);
        if (!fieldMatch) continue;
        const pkgIndex = Number(fieldMatch[1]);
        const field = fieldMatch[2];
        if (field === 'items') continue;
        const pkg: RawPackage = packages.get(pkgIndex) ?? { items: new Map() };
        if (field === 'id') pkg.id = value;
        else if (field === 'label') pkg.label = value;
        else if (field === 'description') pkg.description = value;
        else if (field === 'recommended') pkg.recommended = value;
        packages.set(pkgIndex, pkg);
    }

    return sortedMapValues(packages)
        .map((pkg) => {
            const lineItems = sortedMapValues(pkg.items).map(finalizeLineItem);
            const recommended = pkg.recommended === '1' || pkg.recommended === 'on' || pkg.recommended === 'true';
            return {
                id: pkg.id?.trim() || crypto.randomUUID(),
                label: (pkg.label ?? '').trim() || 'Option',
                description: (pkg.description ?? '').trim() || undefined,
                ...(recommended ? { recommended: true as const } : {}),
                lineItems,
            } satisfies DocumentPackage;
        })
        .filter((pkg) => pkg.lineItems.length > 0 || pkg.label !== 'Option');
}

/**
 * Parse choiceGroups[i][…] / choices[k][…] / items[j][…] from FormData.
 */
export function parseChoiceGroupsFromFormData(formData: FormData): DocumentChoiceGroup[] {
    const groups = new Map<number, RawChoiceGroup>();

    for (const [key, value] of formData.entries()) {
        if (typeof value !== 'string') continue;

        const itemMatch = key.match(
            /^choiceGroups\[(\d+)\]\[choices\]\[(\d+)\]\[items\]\[(\d+)\]\[(\w+)\]$/,
        );
        if (itemMatch) {
            const groupIndex = Number(itemMatch[1]);
            const choiceIndex = Number(itemMatch[2]);
            const itemIndex = Number(itemMatch[3]);
            const field = itemMatch[4];
            const group: RawChoiceGroup = groups.get(groupIndex) ?? { choices: new Map() };
            const choice: RawChoice = group.choices.get(choiceIndex) ?? { items: new Map() };
            const row = choice.items.get(itemIndex) ?? {};
            applyLineField(row, field, value);
            choice.items.set(itemIndex, row);
            group.choices.set(choiceIndex, choice);
            groups.set(groupIndex, group);
            continue;
        }

        const choiceFieldMatch = key.match(
            /^choiceGroups\[(\d+)\]\[choices\]\[(\d+)\]\[(\w+)\]$/,
        );
        if (choiceFieldMatch) {
            const groupIndex = Number(choiceFieldMatch[1]);
            const choiceIndex = Number(choiceFieldMatch[2]);
            const field = choiceFieldMatch[3];
            if (field === 'items') continue;
            const group: RawChoiceGroup = groups.get(groupIndex) ?? { choices: new Map() };
            const choice: RawChoice = group.choices.get(choiceIndex) ?? { items: new Map() };
            if (field === 'id') choice.id = value;
            else if (field === 'label') choice.label = value;
            else if (field === 'description') choice.description = value;
            group.choices.set(choiceIndex, choice);
            groups.set(groupIndex, group);
            continue;
        }

        const groupFieldMatch = key.match(/^choiceGroups\[(\d+)\]\[(\w+)\]$/);
        if (!groupFieldMatch) continue;
        const groupIndex = Number(groupFieldMatch[1]);
        const field = groupFieldMatch[2];
        if (field === 'choices') continue;
        const group: RawChoiceGroup = groups.get(groupIndex) ?? { choices: new Map() };
        if (field === 'id') group.id = value;
        else if (field === 'label') group.label = value;
        else if (field === 'description') group.description = value;
        else if (field === 'required') group.required = value;
        groups.set(groupIndex, group);
    }

    return sortedMapValues(groups)
        .map((group) => {
            const choices: DocumentChoice[] = sortedMapValues(group.choices)
                .map((choice) => ({
                    id: choice.id?.trim() || crypto.randomUUID(),
                    label: (choice.label ?? '').trim() || 'Choice',
                    description: (choice.description ?? '').trim() || undefined,
                    lineItems: sortedMapValues(choice.items).map(finalizeLineItem),
                }))
                .filter((choice) => choice.lineItems.length > 0 || choice.label !== 'Choice');

            const requiredRaw = group.required;
            const required = !(requiredRaw === '0' || requiredRaw === 'false' || requiredRaw === 'off');

            return {
                id: group.id?.trim() || crypto.randomUUID(),
                label: (group.label ?? '').trim() || 'Options',
                description: (group.description ?? '').trim() || undefined,
                required,
                choices,
            } satisfies DocumentChoiceGroup;
        })
        .filter((group) => group.choices.length > 0 || group.label !== 'Options');
}
