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

/** "Basic" → "Basic (copy)", then "Basic (copy 2)", and so on. Blank stays blank. */
export function copiedLabel(label: string): string {
    const trimmed = label.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/^(.*) \(copy(?: (\d+))?\)$/);
    if (!match) return `${trimmed} (copy)`;
    const n = match[2] ? Number(match[2]) + 1 : 2;
    return `${match[1]} (copy ${n})`;
}

function cloneLineItem(item: LineItem): LineItem {
    return { ...item, id: crypto.randomUUID() };
}

function cloneChoice(choice: DocumentChoice, label: string): DocumentChoice {
    return {
        ...choice,
        id: crypto.randomUUID(),
        label,
        lineItems: choice.lineItems.map(cloneLineItem),
    };
}

/** Copy placed after the original. Nested lines get new ids; the copy is not recommended. */
export function duplicatePackage(pkg: DocumentPackage): DocumentPackage {
    const next: DocumentPackage = {
        ...pkg,
        id: crypto.randomUUID(),
        label: copiedLabel(pkg.label),
        lineItems: pkg.lineItems.map(cloneLineItem),
    };
    delete next.recommended;
    return next;
}

/** Copy of one alternative. Nested lines get new ids; the copy is not recommended. */
export function duplicateChoice(choice: DocumentChoice): DocumentChoice {
    const next = cloneChoice(choice, copiedLabel(choice.label));
    delete next.recommended;
    return next;
}

/**
 * Copy of a whole group. Choice labels stay the same (they are the group's content);
 * every nested id is new.
 */
export function duplicateChoiceGroup(group: DocumentChoiceGroup): DocumentChoiceGroup {
    return {
        ...group,
        id: crypto.randomUUID(),
        label: copiedLabel(group.label),
        choices: group.choices.map((choice) => cloneChoice(choice, choice.label)),
    };
}

/** At most one item stays recommended. The first flagged item wins. */
export function withSingleRecommended<T extends { recommended?: boolean }>(items: T[]): T[] {
    let seen = false;
    return items.map((item) => {
        if (item.recommended !== true) return item;
        if (!seen) {
            seen = true;
            return item;
        }
        const next = { ...item };
        delete next.recommended;
        return next;
    });
}

/** At most one recommended choice in each group. */
export function withSingleRecommendedChoices(groups: DocumentChoiceGroup[]): DocumentChoiceGroup[] {
    return groups.map((group) => ({
        ...group,
        choices: withSingleRecommended(group.choices),
    }));
}

/** Mark one choice in a group recommended, or clear it. Other choices in that group lose the flag. */
export function setRecommendedChoice(
    groups: DocumentChoiceGroup[],
    groupId: string,
    choiceId: string,
    recommended: boolean,
): DocumentChoiceGroup[] {
    return groups.map((group) => {
        if (group.id !== groupId) return group;
        return {
            ...group,
            choices: group.choices.map((choice) => {
                const next = { ...choice };
                if (recommended && choice.id === choiceId) next.recommended = true;
                else delete next.recommended;
                return next;
            }),
        };
    });
}

/** True when a package or a choice is marked recommended. */
export function hasRecommendedDefaults(
    doc: Pick<DocumentData, 'packages' | 'choiceGroups'>,
): boolean {
    if ((doc.packages ?? []).some((pkg) => pkg.recommended === true)) return true;
    return (doc.choiceGroups ?? []).some((group) =>
        group.choices.some((choice) => choice.recommended === true),
    );
}

/** Mark one package recommended, or clear the flag. Any other package loses it. */
export function setRecommendedPackage(
    packages: DocumentPackage[],
    packageId: string,
    recommended: boolean,
): DocumentPackage[] {
    return packages.map((pkg) => {
        const next = { ...pkg };
        if (recommended && pkg.id === packageId) next.recommended = true;
        else delete next.recommended;
        return next;
    });
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

function preferredPackage(packages: DocumentPackage[]): DocumentPackage | undefined {
    return packages.find((pkg) => pkg.recommended === true) ?? cheapestPackage(packages);
}

function cheapestChoice(group: DocumentChoiceGroup): DocumentChoice | undefined {
    if (!group.choices.length) return undefined;
    return group.choices.reduce((best, choice) =>
        choiceTotal(choice) < choiceTotal(best) ? choice : best,
    );
}

/** Recommended choice when one is marked; otherwise the cheapest choice of a required group. */
function fallbackChoice(group: DocumentChoiceGroup): DocumentChoice | undefined {
    const recommended = group.choices.find((choice) => choice.recommended === true);
    if (recommended) return recommended;
    if (isChoiceGroupRequired(group)) return cheapestChoice(group);
    return undefined;
}

function cloneLineItems(lineItems: LineItem[]): LineItem[] {
    return lineItems.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

/**
 * Resolve the flat line-item list for the selected configuration.
 * Missing answers use the recommended package and recommended choices.
 * A required group with no recommendation falls back to its cheapest choice.
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
        const pkg = selectedPkg ?? preferredPackage(packages);
        if (pkg) resolved.push(...wrap(normalizeLineItems(pkg.lineItems)));
    }

    for (const group of doc.choiceGroups ?? []) {
        const selectedId = selection?.choices?.[group.id];
        const selected = selectedId
            ? group.choices.find((c) => c.id === selectedId)
            : undefined;
        const choice = selected ?? fallbackChoice(group);
        if (choice) resolved.push(...wrap(normalizeLineItems(choice.lineItems)));
    }

    return resolved;
}

export function selectedTotal(
    doc: Pick<DocumentData, 'lineItems' | 'packages' | 'choiceGroups' | 'optionSelection'>,
): number {
    return lineItemsTotal(resolveSelectedLineItems(doc));
}

/** Base + recommended (or cheapest) package + recommended or required-group choices. */
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
