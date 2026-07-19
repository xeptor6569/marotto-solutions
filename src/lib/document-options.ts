import type {
    DocumentChoice,
    DocumentChoiceGroup,
    DocumentData,
    DocumentOptionSelection,
    DocumentPackage,
    LineItem,
} from '@/lib/types';

function normalizeLineItems(lineItems: LineItem[] | null | undefined): LineItem[] {
    return Array.isArray(lineItems) ? lineItems : [];
}

function roundMoney(n: number): number {
    return Math.round((Number(n) || 0) * 100) / 100;
}

export function lineItemsTotal(lineItems: LineItem[] | null | undefined): number {
    return roundMoney(
        normalizeLineItems(lineItems).reduce((sum, item) => sum + (Number(item.total) || 0), 0),
    );
}

export function packageTotal(pkg: DocumentPackage): number {
    return lineItemsTotal(pkg.lineItems);
}

export function choiceTotal(choice: DocumentChoice): number {
    return lineItemsTotal(choice.lineItems);
}

export function documentHasOptions(doc: Pick<DocumentData, 'packages' | 'choiceGroups'>): boolean {
    return (doc.packages?.length ?? 0) > 0 || (doc.choiceGroups?.length ?? 0) > 0;
}

export function isChoiceGroupRequired(group: DocumentChoiceGroup): boolean {
    return group.required !== false;
}

/** True when every required option has an answer (packages require a packageId when present). */
export function isOptionSelectionComplete(
    doc: Pick<DocumentData, 'packages' | 'choiceGroups' | 'optionSelection'>,
): boolean {
    if (!documentHasOptions(doc)) return true;

    const selection = doc.optionSelection;
    const packages = doc.packages ?? [];
    if (packages.length > 0) {
        const packageId = selection?.packageId;
        if (!packageId || !packages.some((pkg) => pkg.id === packageId)) {
            return false;
        }
    }

    for (const group of doc.choiceGroups ?? []) {
        if (!isChoiceGroupRequired(group)) continue;
        if (!group.choices.length) continue;
        const choiceId = selection?.choices?.[group.id];
        if (!choiceId || !group.choices.some((c) => c.id === choiceId)) {
            return false;
        }
    }

    return true;
}

function cheapestPackage(packages: DocumentPackage[]): DocumentPackage | undefined {
    if (!packages.length) return undefined;
    return packages.reduce((best, pkg) =>
        packageTotal(pkg) < packageTotal(best) ? pkg : best,
    );
}

function cheapestChoice(group: DocumentChoiceGroup): DocumentChoice | undefined {
    if (!group.choices.length) return undefined;
    return group.choices.reduce((best, choice) =>
        choiceTotal(choice) < choiceTotal(best) ? choice : best,
    );
}

function cloneLineItems(lineItems: LineItem[]): LineItem[] {
    return lineItems.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

/**
 * Resolve the flat line-item list for the selected configuration.
 * When selection is incomplete, uses starting-from (cheapest package + cheapest
 * required choices) so previews and stored totals stay meaningful.
 */
export function resolveSelectedLineItems(
    doc: Pick<DocumentData, 'lineItems' | 'packages' | 'choiceGroups' | 'optionSelection'>,
    options?: { regenerateIds?: boolean },
): LineItem[] {
    const regenerateIds = options?.regenerateIds === true;
    const wrap = (items: LineItem[]) => (regenerateIds ? cloneLineItems(items) : [...items]);

    const resolved: LineItem[] = wrap(normalizeLineItems(doc.lineItems));
    const packages = doc.packages ?? [];
    const selection = doc.optionSelection;

    if (packages.length > 0) {
        const selectedPkg = selection?.packageId
            ? packages.find((pkg) => pkg.id === selection.packageId)
            : undefined;
        const pkg = selectedPkg ?? cheapestPackage(packages);
        if (pkg) resolved.push(...wrap(normalizeLineItems(pkg.lineItems)));
    }

    for (const group of doc.choiceGroups ?? []) {
        const selectedId = selection?.choices?.[group.id];
        const selected = selectedId
            ? group.choices.find((c) => c.id === selectedId)
            : undefined;
        if (selected) {
            resolved.push(...wrap(normalizeLineItems(selected.lineItems)));
            continue;
        }
        // Starting-from: include cheapest for required groups when incomplete.
        if (isChoiceGroupRequired(group)) {
            const fallback = cheapestChoice(group);
            if (fallback) resolved.push(...wrap(normalizeLineItems(fallback.lineItems)));
        }
    }

    return resolved;
}

export function selectedTotal(
    doc: Pick<DocumentData, 'lineItems' | 'packages' | 'choiceGroups' | 'optionSelection'>,
): number {
    return lineItemsTotal(resolveSelectedLineItems(doc));
}

/** Base + cheapest package (if any) + cheapest choice per required group. */
export function startingFromTotal(
    doc: Pick<DocumentData, 'lineItems' | 'packages' | 'choiceGroups'>,
): number {
    return selectedTotal({
        lineItems: doc.lineItems,
        packages: doc.packages,
        choiceGroups: doc.choiceGroups,
        optionSelection: undefined,
    });
}

/** Stored document total: selected when complete, otherwise starting-from. */
export function documentDisplayTotal(
    doc: Pick<DocumentData, 'lineItems' | 'packages' | 'choiceGroups' | 'optionSelection'>,
): number {
    if (!documentHasOptions(doc)) {
        return lineItemsTotal(doc.lineItems);
    }
    return selectedTotal(doc);
}

/** Clear pending-approval flags for invoice billing (same spirit as convert). */
export function stripOptionsForInvoice(lineItems: LineItem[]): LineItem[] {
    return lineItems.map((item) => {
        const copy: LineItem = { ...item, id: crypto.randomUUID() };
        delete copy.pendingClientApproval;
        return copy;
    });
}

export function buildOptionSelection(input: {
    packageId?: string | null;
    choices?: Record<string, string>;
    by?: DocumentOptionSelection['by'];
    at?: string;
}): DocumentOptionSelection {
    return {
        packageId: input.packageId ?? null,
        choices: input.choices ?? {},
        by: input.by ?? 'admin',
        at: input.at ?? new Date().toISOString(),
    };
}

/** Keep selection ids that still exist after an edit; drop stale ones. */
export function sanitizeOptionSelection(
    doc: Pick<DocumentData, 'packages' | 'choiceGroups' | 'optionSelection'>,
): DocumentOptionSelection | undefined {
    const selection = doc.optionSelection;
    if (!selection) return undefined;

    const packages = doc.packages ?? [];
    let packageId = selection.packageId ?? null;
    if (packageId && !packages.some((pkg) => pkg.id === packageId)) {
        packageId = null;
    }

    const choices: Record<string, string> = {};
    for (const group of doc.choiceGroups ?? []) {
        const choiceId = selection.choices?.[group.id];
        if (choiceId && group.choices.some((c) => c.id === choiceId)) {
            choices[group.id] = choiceId;
        }
    }

    if (!packageId && Object.keys(choices).length === 0) {
        return undefined;
    }

    return {
        packageId,
        choices,
        by: selection.by === 'client' ? 'client' : 'admin',
        at: selection.at || new Date().toISOString(),
    };
}
