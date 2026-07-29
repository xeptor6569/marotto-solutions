import { isDatabaseConfigured, prisma } from '@/lib/prisma';

export interface HelperRecord {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface HelperOption {
    id: string;
    name: string;
    active: boolean;
}

export interface HelperInput {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    active?: boolean;
}

export interface HelperWithTotals extends HelperRecord {
    payoutCount: number;
    payoutTotal: number;
}

function normalizeHelperInput(input: HelperInput) {
    const name = input.name?.trim();
    if (!name) throw new Error('Helper name is required.');
    return {
        name,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
        active: input.active ?? true,
    };
}

export async function listHelpers(options?: { includeInactive?: boolean }): Promise<HelperWithTotals[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        const helpers = await prisma.helper.findMany({
            where: options?.includeInactive ? undefined : { active: true },
            orderBy: [{ active: 'desc' }, { name: 'asc' }],
            include: {
                payouts: { select: { amount: true } },
            },
        });
        return helpers.map((helper) => {
            const { payouts, ...rest } = helper;
            return {
                ...rest,
                payoutCount: payouts.length,
                payoutTotal: Math.round(payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) * 100) / 100,
            };
        });
    } catch (error) {
        console.error('Failed to load helpers', error);
        return [];
    }
}

export async function getHelperOptions(options?: { includeInactive?: boolean }): Promise<HelperOption[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        return await prisma.helper.findMany({
            where: options?.includeInactive ? undefined : { active: true },
            orderBy: [{ active: 'desc' }, { name: 'asc' }],
            select: { id: true, name: true, active: true },
        });
    } catch (error) {
        console.error('Failed to load helper options', error);
        return [];
    }
}

export async function getHelperById(id: string): Promise<HelperRecord | null> {
    if (!isDatabaseConfigured()) return null;
    try {
        return await prisma.helper.findUnique({ where: { id } });
    } catch (error) {
        console.error(`Failed to load helper ${id}`, error);
        return null;
    }
}

export async function createHelper(input: HelperInput): Promise<HelperRecord> {
    const data = normalizeHelperInput(input);
    return prisma.helper.create({ data });
}

export async function updateHelper(id: string, input: HelperInput): Promise<HelperRecord> {
    const data = normalizeHelperInput(input);
    return prisma.helper.update({ where: { id }, data });
}

export async function deleteHelper(id: string): Promise<void> {
    await prisma.helper.delete({ where: { id } });
}
