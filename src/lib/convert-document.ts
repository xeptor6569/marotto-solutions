import type { DocumentData, DocumentType, LineItem } from '@/lib/types';
import { DOC_LABEL } from '@/lib/document-labels';
import {
    documentHasOptions,
    resolveSelectedLineItems,
    stripOptionsForInvoice,
} from '@/lib/document-options';

/**
 * Allowed "create from existing" conversions between document types.
 * Estimates can become quotes or invoices; quotes can become invoices.
 */
export const ALLOWED_CONVERSIONS: Partial<Record<DocumentType, DocumentType[]>> = {
    estimate: ['quote', 'invoice'],
    quote: ['invoice'],
};

const PREFIX: Record<DocumentType, string> = {
    invoice: 'INV',
    estimate: 'EST',
    quote: 'QTE',
    receipt: 'RCT',
    lead: 'LEAD',
};

export function convertTargets(from: DocumentType): DocumentType[] {
    return ALLOWED_CONVERSIONS[from] ?? [];
}

export function canConvert(from: DocumentType, to: DocumentType): boolean {
    return convertTargets(from).includes(to);
}

function cloneLineItemsPreservingPending(items: LineItem[]): LineItem[] {
    return items.map((item) => ({ ...item, id: crypto.randomUUID() }));
}

/**
 * Build a fresh draft document of `targetType` based on an existing source
 * document. Copies the customer, job, line items, and notes. When converting
 * to an invoice every line is billed (the `pendingClientApproval` flag is
 * dropped) and packages/choice groups are flattened into selected line items.
 * When converting to a quote the option structure and selection are preserved.
 */
export function buildConvertedDocument(
    source: DocumentData,
    targetType: DocumentType,
    newNumber: number,
): DocumentData {
    if (!canConvert(source.type, targetType)) {
        throw new Error(
            `Cannot convert a ${DOC_LABEL[source.type]} to a ${DOC_LABEL[targetType]}.`,
        );
    }

    const now = new Date().toISOString();
    const id = `${PREFIX[targetType]}-${String(newNumber).padStart(4, '0')}`;

    let lineItems: LineItem[];
    if (targetType === 'invoice') {
        const resolved = documentHasOptions(source)
            ? resolveSelectedLineItems(source, { regenerateIds: true })
            : cloneLineItemsPreservingPending(source.lineItems);
        lineItems = stripOptionsForInvoice(resolved);
    } else {
        // estimate → quote: preserve base lines and option structure
        lineItems = cloneLineItemsPreservingPending(source.lineItems);
    }

    const subtotal = Math.round(lineItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0) * 100) / 100;
    const total = subtotal;

    const sourceLabel = DOC_LABEL[source.type];
    const sourceRef = `Created from ${sourceLabel} ${source.id}.`;
    const notes = source.notes ? `${source.notes}\n\n${sourceRef}` : sourceRef;

    const doc: DocumentData = {
        id,
        number: newNumber,
        type: targetType,
        title: source.title,
        date: now.split('T')[0],
        dueDate: source.dueDate,
        customer: { ...source.customer },
        jobId: source.jobId || source.customer.jobId,
        lineItems,
        subtotal,
        total,
        notes,
        status: 'draft',
        tags: ['converted', `source:${source.id}`],
        createdAt: now,
        updatedAt: now,
    };

    if (targetType === 'quote' && documentHasOptions(source)) {
        if (source.packages?.length) {
            doc.packages = source.packages.map((pkg) => ({
                ...pkg,
                id: crypto.randomUUID(),
                lineItems: cloneLineItemsPreservingPending(pkg.lineItems),
            }));
        }
        if (source.choiceGroups?.length) {
            doc.choiceGroups = source.choiceGroups.map((group) => ({
                ...group,
                id: crypto.randomUUID(),
                choices: group.choices.map((choice) => ({
                    ...choice,
                    id: crypto.randomUUID(),
                    lineItems: cloneLineItemsPreservingPending(choice.lineItems),
                })),
            }));
        }
        // Remap selection ids after regenerating package/group/choice ids — drop selection
        // rather than risk stale ids pointing at the wrong options.
        // Admin can re-select on the new quote; structure is what matters for convert.
        if (source.optionSelection) {
            // Best-effort remap by label match for packages/choices
            const packageId = remapPackageSelection(source, doc);
            const choices = remapChoiceSelection(source, doc);
            if (packageId || Object.keys(choices).length > 0) {
                doc.optionSelection = {
                    packageId: packageId ?? null,
                    choices,
                    by: source.optionSelection.by,
                    at: now,
                };
            }
        }
    }

    if (targetType === 'invoice') {
        doc.payments = [];
        doc.paidAmount = 0;
        doc.balanceDue = total;
    }

    return doc;
}

function remapPackageSelection(
    source: DocumentData,
    target: DocumentData,
): string | null | undefined {
    const selectedId = source.optionSelection?.packageId;
    if (!selectedId || !source.packages || !target.packages) return null;
    const sourcePkg = source.packages.find((p) => p.id === selectedId);
    if (!sourcePkg) return null;
    const match = target.packages.find((p) => p.label === sourcePkg.label);
    return match?.id ?? null;
}

function remapChoiceSelection(
    source: DocumentData,
    target: DocumentData,
): Record<string, string> {
    const result: Record<string, string> = {};
    const selected = source.optionSelection?.choices ?? {};
    if (!source.choiceGroups || !target.choiceGroups) return result;

    for (const sourceGroup of source.choiceGroups) {
        const choiceId = selected[sourceGroup.id];
        if (!choiceId) continue;
        const sourceChoice = sourceGroup.choices.find((c) => c.id === choiceId);
        if (!sourceChoice) continue;
        const targetGroup = target.choiceGroups.find((g) => g.label === sourceGroup.label);
        if (!targetGroup) continue;
        const targetChoice = targetGroup.choices.find((c) => c.label === sourceChoice.label);
        if (targetChoice) {
            result[targetGroup.id] = targetChoice.id;
        }
    }
    return result;
}
