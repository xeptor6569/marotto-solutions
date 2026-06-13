import { prisma } from '@/lib/prisma';

const SERVICE_LABELS: Record<string, string> = {
    general: 'General Contracting',
    it: 'IT / Networking',
    pc: 'PC Building',
    programming: 'Programming / Dev',
    other: 'Other',
};

export interface QuoteRequestInput {
    name: string;
    email: string;
    service: string;
    details: string;
    date?: string;
}

export function serviceLabel(service: string): string {
    return SERVICE_LABELS[service] || service;
}

export function formatQuoteIntakeNote(input: QuoteRequestInput): string {
    const when = new Date().toLocaleString();
    const lines = [
        `--- Website quote request (${when}) ---`,
        `Service: ${serviceLabel(input.service)}`,
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
export async function upsertProspectFromQuoteRequest(input: QuoteRequestInput): Promise<UpsertProspectResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email) {
        return { ok: false, error: 'Name and email are required.' };
    }

    const intakeNote = formatQuoteIntakeNote({ ...input, email });

    try {
        const existing = await prisma.client.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (existing) {
            const updated = await prisma.client.update({
                where: { id: existing.id },
                data: {
                    name: name || existing.name,
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
