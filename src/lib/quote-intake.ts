import { prisma } from '@/lib/prisma';

// Legacy form values kept so old prefill links (/?service=it#quote) and
// historical intake notes still resolve to a readable label. Configured
// services take precedence via the optional `labels` map.
const LEGACY_SERVICE_LABELS: Record<string, string> = {
    general: 'General Contracting',
    it: 'IT / Networking',
    pc: 'PC Building',
    programming: 'Programming / Dev',
    other: 'Other',
};

export interface QuoteRequestInput {
    name: string;
    email: string;
    phone: string;
    service: string;
    details: string;
    date?: string;
}

export function serviceLabel(service: string, labels?: Record<string, string>): string {
    return labels?.[service] || LEGACY_SERVICE_LABELS[service] || service;
}

export function formatQuoteIntakeNote(input: QuoteRequestInput, labels?: Record<string, string>): string {
    const when = new Date().toLocaleString();
    const lines = [
        `--- Website quote request (${when}) ---`,
        `Service: ${serviceLabel(input.service, labels)}`,
        `Phone: ${input.phone.trim()}`,
        input.date?.trim() ? `Preferred schedule: ${input.date.trim()}` : null,
        `Details: ${input.details.trim()}`,
    ].filter(Boolean);
    return lines.join('\n');
}

function appendNotes(existing: string | null | undefined, entry: string): string {
    const prev = (existing || '').trim();
    return prev ? `${prev}\n\n${entry}` : entry;
}

export type UpsertProspectResult =
    | { ok: true; clientId: string; created: boolean }
    | { ok: false; error: string };

/**
 * Create or update a prospect Client from a homepage quote submission.
 * Matches on email (case-insensitive); appends a timestamped intake note.
 */
export async function upsertProspectFromQuoteRequest(
    input: QuoteRequestInput,
    serviceLabels?: Record<string, string>,
): Promise<UpsertProspectResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    if (!name || !email || !phone) {
        return { ok: false, error: 'Name, email, and phone are required.' };
    }

    const intakeNote = formatQuoteIntakeNote({ ...input, email }, serviceLabels);

    try {
        const existing = await prisma.client.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (existing) {
            const updated = await prisma.client.update({
                where: { id: existing.id },
                data: {
                    name: name || existing.name,
                    phone,
                    notes: appendNotes(existing.notes, intakeNote),
                    isProspect: true,
                },
            });
            return { ok: true, clientId: updated.id, created: false };
        }

        const created = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                notes: intakeNote,
                isProspect: true,
            },
        });
        return { ok: true, clientId: created.id, created: true };
    } catch (error) {
        console.error('upsertProspectFromQuoteRequest', error);
        const message = error instanceof Error ? error.message : 'Failed to save client.';
        return { ok: false, error: message };
    }
}
