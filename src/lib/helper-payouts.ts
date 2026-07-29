import { isDatabaseConfigured, prisma } from '@/lib/prisma';

export interface HelperPayoutRecord {
    id: string;
    helperId: string;
    jobId: string | null;
    amount: number;
    paidAt: Date;
    method: string | null;
    notes: string | null;
    createdAt: Date;
    helper?: { id: string; name: string };
    job?: { id: string; name: string } | null;
}

export interface HelperPayoutInput {
    helperId: string;
    amount: number;
    paidAt?: Date | string;
    method?: string;
    notes?: string;
    jobId?: string;
}

function parsePaidAt(value?: Date | string): Date {
    if (!value) return new Date();
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) throw new Error('Invalid payout date.');
        return value;
    }
    const trimmed = value.trim();
    if (!trimmed) return new Date();
    // Date-only inputs should stay on the intended calendar day in local terms;
    // store noon UTC to avoid timezone day-shift for YYYY-MM-DD.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    const parsed = new Date(dateOnly ? `${trimmed}T12:00:00.000Z` : trimmed);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid payout date.');
    return parsed;
}

function normalizePayoutInput(input: HelperPayoutInput) {
    const helperId = input.helperId?.trim();
    if (!helperId) throw new Error('Helper is required.');
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Payout amount must be greater than zero.');
    }
    return {
        helperId,
        amount: Math.round(amount * 100) / 100,
        paidAt: parsePaidAt(input.paidAt),
        method: input.method?.trim() || null,
        notes: input.notes?.trim() || null,
        jobId: input.jobId?.trim() || null,
    };
}

export async function listPayoutsForHelper(helperId: string): Promise<HelperPayoutRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        return await prisma.helperPayout.findMany({
            where: { helperId },
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                job: { select: { id: true, name: true } },
            },
        });
    } catch (error) {
        console.error(`Failed to load payouts for helper ${helperId}`, error);
        return [];
    }
}

export async function listPayoutsForJob(jobId: string): Promise<HelperPayoutRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        return await prisma.helperPayout.findMany({
            where: { jobId },
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                helper: { select: { id: true, name: true } },
            },
        });
    } catch (error) {
        console.error(`Failed to load payouts for job ${jobId}`, error);
        return [];
    }
}

export async function listRecentPayouts(limit = 20): Promise<HelperPayoutRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        return await prisma.helperPayout.findMany({
            take: Math.max(1, Math.min(100, limit)),
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                helper: { select: { id: true, name: true } },
                job: { select: { id: true, name: true } },
            },
        });
    } catch (error) {
        console.error('Failed to load recent helper payouts', error);
        return [];
    }
}

export async function createHelperPayout(input: HelperPayoutInput): Promise<HelperPayoutRecord> {
    const data = normalizePayoutInput(input);
    return prisma.helperPayout.create({
        data,
        include: {
            helper: { select: { id: true, name: true } },
            job: { select: { id: true, name: true } },
        },
    });
}

export async function deleteHelperPayout(id: string): Promise<void> {
    await prisma.helperPayout.delete({ where: { id } });
}

export function sumPayoutAmounts(payouts: Array<{ amount: number }>): number {
    return Math.round(payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) * 100) / 100;
}

export function formatPayoutPaidAt(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
}
