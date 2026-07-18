import { Prisma } from '@prisma/client';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import { getNextNumber, saveNewDocument, getDocuments } from '@/lib/data';
import { generateShareToken, withContractShareToken } from '@/lib/share-token';
import type {
    ContractInput,
    ContractIntervalUnit,
    ContractLineInput,
    ContractLineKind,
    ContractStatus,
    DocumentData,
    LineItem,
} from '@/lib/types';

const CONTRACT_DISPLAY_PREFIX = 'CTR';
const CONTRACT_NUMBER_BASELINE = 1;
const MAX_CATCHUP_CYCLES = 24;

export interface ContractLineRecord {
    id: string;
    contractId: string;
    kind: ContractLineKind;
    description: string;
    details: string | null;
    quantity: number;
    unitPrice: number;
    position: number;
}

export interface ContractRecord {
    id: string;
    number: number;
    displayId: string;
    title: string;
    status: ContractStatus;
    jobId: string | null;
    clientId: string | null;
    leadId: string | null;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    intervalUnit: ContractIntervalUnit;
    intervalCount: number;
    startDate: Date;
    endDate: Date | null;
    termCycles: number | null;
    autoRenew: boolean;
    autoSend: boolean;
    paymentTerms: string | null;
    notes: string | null;
    lastIssuedDate: Date | null;
    nextDueDate: Date;
    cyclesIssued: number;
    shareToken: string;
    createdAt: Date;
    updatedAt: Date;
    lines: ContractLineRecord[];
}

type RawContract = Prisma.ContractGetPayload<{ include: { lines: true } }>;

function isIntervalUnit(value: string): value is ContractIntervalUnit {
    return value === 'day' || value === 'month' || value === 'year';
}

function isStatus(value: string): value is ContractStatus {
    return value === 'active' || value === 'paused' || value === 'ended' || value === 'cancelled';
}

function isLineKind(value: string): value is ContractLineKind {
    return value === 'recurring' || value === 'usage';
}

export function formatContractDisplayId(number: number): string {
    return `${CONTRACT_DISPLAY_PREFIX}-${String(number).padStart(4, '0')}`;
}

function toContractRecord(raw: RawContract): ContractRecord {
    return {
        id: raw.id,
        number: raw.number,
        displayId: formatContractDisplayId(raw.number),
        title: raw.title,
        status: isStatus(raw.status) ? raw.status : 'active',
        jobId: raw.jobId,
        clientId: raw.clientId,
        leadId: raw.leadId,
        customerName: raw.customerName,
        customerEmail: raw.customerEmail,
        customerPhone: raw.customerPhone,
        customerAddress: raw.customerAddress,
        intervalUnit: isIntervalUnit(raw.intervalUnit) ? raw.intervalUnit : 'month',
        intervalCount: raw.intervalCount,
        startDate: raw.startDate,
        endDate: raw.endDate,
        termCycles: raw.termCycles,
        autoRenew: raw.autoRenew,
        autoSend: raw.autoSend,
        paymentTerms: raw.paymentTerms,
        notes: raw.notes,
        lastIssuedDate: raw.lastIssuedDate,
        nextDueDate: raw.nextDueDate,
        cyclesIssued: raw.cyclesIssued,
        shareToken: raw.shareToken,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        lines: raw.lines
            .map((line) => ({
                id: line.id,
                contractId: line.contractId,
                kind: isLineKind(line.kind) ? line.kind : 'recurring',
                description: line.description,
                details: line.details,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                position: line.position,
            }))
            .sort((a, b) => a.position - b.position || a.description.localeCompare(b.description)),
    };
}

/** Add `count` cadence steps to `from`, preserving day-of-month for month/year. */
export function addInterval(from: Date, unit: ContractIntervalUnit, count: number): Date {
    const result = new Date(from);
    if (unit === 'day') {
        result.setDate(result.getDate() + count);
    } else if (unit === 'month') {
        const day = result.getDate();
        result.setDate(1);
        result.setMonth(result.getMonth() + count);
        const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
        result.setDate(Math.min(day, lastDay));
    } else {
        result.setFullYear(result.getFullYear() + count);
    }
    return result;
}

export function advanceNextDueDate(contract: ContractRecord, from?: Date): Date {
    const base = from ?? contract.nextDueDate;
    return addInterval(base, contract.intervalUnit, contract.intervalCount);
}

async function getNextContractNumber(): Promise<number> {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.documentCounter.findUnique({ where: { type: 'contract' } });
        const last = await tx.contract.aggregate({ _max: { number: true } });
        const baseline = Math.max(existing?.lastValue ?? 0, last._max.number ?? 0, CONTRACT_NUMBER_BASELINE - 1);
        const next = baseline + 1;
        await tx.documentCounter.upsert({
            where: { type: 'contract' },
            update: { lastValue: next },
            create: { type: 'contract', lastValue: next },
        });
        return next;
    });
}

function ensureDb(): void {
    if (!isDatabaseConfigured()) {
        throw new Error('Database is not configured. Set DATABASE_URL to use service contracts.');
    }
}

export async function getContracts(): Promise<ContractRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        const rows = await prisma.contract.findMany({
            include: { lines: true },
            orderBy: [{ status: 'asc' }, { nextDueDate: 'asc' }, { number: 'desc' }],
        });
        return rows.map(toContractRecord);
    } catch (error) {
        console.error('Failed to load contracts', error);
        return [];
    }
}

export async function getContractById(id: string): Promise<ContractRecord | null> {
    if (!isDatabaseConfigured()) return null;
    try {
        const row = await prisma.contract.findFirst({
            where: { OR: [{ id }, { number: Number.isFinite(Number(id)) ? Number(id) : -1 }] },
            include: { lines: true },
        });
        return row ? toContractRecord(row) : null;
    } catch (error) {
        console.error(`Failed to load contract ${id}`, error);
        return null;
    }
}

/** Look up by either uuid or display id ("CTR-0001"). */
export async function getContractByDisplayId(displayId: string): Promise<ContractRecord | null> {
    if (!isDatabaseConfigured()) return null;
    const trimmed = displayId.trim();
    const matchPrefix = trimmed.toUpperCase().startsWith(`${CONTRACT_DISPLAY_PREFIX}-`);
    if (matchPrefix) {
        const numStr = trimmed.slice(CONTRACT_DISPLAY_PREFIX.length + 1);
        const num = Number(numStr);
        if (!Number.isFinite(num)) return null;
        const row = await prisma.contract.findFirst({
            where: { number: num },
            include: { lines: true },
        });
        return row ? toContractRecord(row) : null;
    }
    return getContractById(trimmed);
}

/** Look up a contract by its unguessable public share token. */
export async function getContractByShareToken(token: string): Promise<ContractRecord | null> {
    if (!isDatabaseConfigured()) return null;
    const trimmed = token?.trim();
    if (!trimmed || trimmed.length < 16) return null;
    try {
        const row = await prisma.contract.findUnique({
            where: { shareToken: trimmed },
            include: { lines: true },
        });
        return row ? toContractRecord(row) : null;
    } catch (error) {
        console.error('Failed to load contract by share token', error);
        return null;
    }
}

/**
 * Ensure the contract has a shareToken, persisting if one was minted.
 * Returns the contract with a guaranteed shareToken.
 */
export async function ensureContractShareToken(contract: ContractRecord): Promise<ContractRecord> {
    const { shareToken, minted } = withContractShareToken(contract);
    if (!minted) return { ...contract, shareToken };
    if (!isDatabaseConfigured()) {
        return { ...contract, shareToken };
    }
    try {
        const row = await prisma.contract.update({
            where: { id: contract.id },
            data: { shareToken },
            include: { lines: true },
        });
        return toContractRecord(row);
    } catch (error) {
        console.error(`Failed to backfill share token for contract ${contract.id}`, error);
        return { ...contract, shareToken };
    }
}

export async function getContractsDue(now: Date = new Date()): Promise<ContractRecord[]> {
    if (!isDatabaseConfigured()) return [];
    try {
        const rows = await prisma.contract.findMany({
            where: { status: 'active', nextDueDate: { lte: now } },
            include: { lines: true },
            orderBy: { nextDueDate: 'asc' },
        });
        return rows.map(toContractRecord);
    } catch (error) {
        console.error('Failed to load contracts due', error);
        return [];
    }
}

function normalizeLines(lines: ContractLineInput[]): ContractLineInput[] {
    return lines
        .map((line, index): ContractLineInput => ({
            id: line.id,
            kind: line.kind === 'usage' ? 'usage' : 'recurring',
            description: (line.description || '').trim(),
            details: line.details?.trim() || undefined,
            quantity: Number.isFinite(line.quantity) ? Number(line.quantity) : 0,
            unitPrice: Number.isFinite(line.unitPrice) ? Number(line.unitPrice) : 0,
            position: line.position ?? index,
        }))
        .filter((line) => line.description.length > 0);
}

function sanitizeContractInput(input: ContractInput) {
    if (!input.title?.trim()) throw new Error('Title is required');
    if (!input.customerName?.trim()) throw new Error('Customer name is required');
    if (!input.intervalUnit || !isIntervalUnit(input.intervalUnit)) {
        throw new Error('Interval unit must be day, month, or year');
    }
    const intervalCount = Math.max(1, Math.floor(Number(input.intervalCount) || 1));
    const startDate = new Date(input.startDate);
    if (Number.isNaN(startDate.getTime())) throw new Error('Start date is invalid');
    const endDate = input.endDate ? new Date(input.endDate) : null;
    if (endDate && Number.isNaN(endDate.getTime())) throw new Error('End date is invalid');
    const termCycles = input.termCycles ? Math.max(1, Math.floor(Number(input.termCycles))) : null;
    const lines = normalizeLines(input.lines || []);
    return { intervalCount, startDate, endDate, termCycles, lines };
}

export async function createContract(input: ContractInput): Promise<ContractRecord> {
    ensureDb();
    const { intervalCount, startDate, endDate, termCycles, lines } = sanitizeContractInput(input);
    const number = await getNextContractNumber();

    const created = await prisma.contract.create({
        data: {
            number,
            title: input.title.trim(),
            status: input.status && isStatus(input.status) ? input.status : 'active',
            jobId: input.jobId || null,
            clientId: input.clientId || null,
            leadId: input.leadId || null,
            customerName: input.customerName.trim(),
            customerEmail: input.customerEmail?.trim() || null,
            customerPhone: input.customerPhone?.trim() || null,
            customerAddress: input.customerAddress?.trim() || null,
            intervalUnit: input.intervalUnit,
            intervalCount,
            startDate,
            endDate,
            termCycles,
            autoRenew: !!input.autoRenew,
            autoSend: !!input.autoSend,
            paymentTerms: input.paymentTerms?.trim() || null,
            notes: input.notes?.trim() || null,
            nextDueDate: startDate,
            shareToken: generateShareToken(),
            lines: {
                create: lines.map((line, index) => ({
                    kind: line.kind,
                    description: line.description,
                    details: line.details ?? null,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    position: line.position ?? index,
                })),
            },
        },
        include: { lines: true },
    });
    return toContractRecord(created);
}

export async function updateContract(id: string, input: ContractInput): Promise<ContractRecord> {
    ensureDb();
    const { intervalCount, startDate, endDate, termCycles, lines } = sanitizeContractInput(input);

    const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.contract.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Contract not found');
        }
        await tx.contractLine.deleteMany({ where: { contractId: id } });
        const next = await tx.contract.update({
            where: { id },
            data: {
                title: input.title.trim(),
                status: input.status && isStatus(input.status) ? input.status : existing.status,
                jobId: input.jobId || null,
                clientId: input.clientId || null,
                leadId: input.leadId || null,
                customerName: input.customerName.trim(),
                customerEmail: input.customerEmail?.trim() || null,
                customerPhone: input.customerPhone?.trim() || null,
                customerAddress: input.customerAddress?.trim() || null,
                intervalUnit: input.intervalUnit,
                intervalCount,
                startDate,
                endDate,
                termCycles,
                autoRenew: !!input.autoRenew,
                autoSend: !!input.autoSend,
                paymentTerms: input.paymentTerms?.trim() || null,
                notes: input.notes?.trim() || null,
                lines: {
                    create: lines.map((line, index) => ({
                        kind: line.kind,
                        description: line.description,
                        details: line.details ?? null,
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        position: line.position ?? index,
                    })),
                },
            },
            include: { lines: true },
        });
        return next;
    });
    return toContractRecord(updated);
}

export async function deleteContract(id: string): Promise<void> {
    ensureDb();
    await prisma.contract.delete({ where: { id } });
}

async function setContractStatus(id: string, status: ContractStatus): Promise<ContractRecord> {
    ensureDb();
    const row = await prisma.contract.update({
        where: { id },
        data: { status },
        include: { lines: true },
    });
    return toContractRecord(row);
}

export async function pauseContract(id: string) {
    return setContractStatus(id, 'paused');
}

export async function resumeContract(id: string) {
    return setContractStatus(id, 'active');
}

export async function endContract(id: string) {
    return setContractStatus(id, 'ended');
}

export async function cancelContract(id: string) {
    return setContractStatus(id, 'cancelled');
}

export interface IssueInvoiceResult {
    invoice: DocumentData;
    contract: ContractRecord;
    cycle: number;
}

interface IssueOptions {
    /** Force-issue even if nextDueDate is in the future. */
    force?: boolean;
    /** Override the invoice document date (defaults to today). */
    invoiceDate?: Date;
}

function buildInvoiceLineItems(contract: ContractRecord): LineItem[] {
    return contract.lines.map((line) => {
        const quantity = line.kind === 'usage' ? 0 : line.quantity;
        const total = quantity * line.unitPrice;
        return {
            id: crypto.randomUUID(),
            description: line.description,
            details: line.details || (line.kind === 'usage'
                ? 'Usage line — set quantity before sending.'
                : undefined),
            quantity,
            unitPrice: line.unitPrice,
            total,
        };
    });
}

function defaultDueDateFromTerms(date: Date, paymentTerms: string | null): Date | undefined {
    if (!paymentTerms) return undefined;
    const match = paymentTerms.match(/net\s*(\d+)/i);
    if (!match) return undefined;
    const days = Number(match[1]);
    if (!Number.isFinite(days) || days <= 0) return undefined;
    return addInterval(date, 'day', days);
}

/** Look for an existing invoice for this cycle so we don't double-issue. */
async function findExistingCycleInvoice(contractId: string, cycle: number): Promise<DocumentData | undefined> {
    const invoices = await getDocuments('invoice');
    return invoices.find((inv) => inv.contractId === contractId && inv.contractCycle === cycle);
}

export async function issueInvoiceFromContract(
    contract: ContractRecord,
    options: IssueOptions = {},
): Promise<IssueInvoiceResult> {
    ensureDb();
    if (contract.status !== 'active' && !options.force) {
        throw new Error(`Contract is ${contract.status}; cannot issue an invoice automatically.`);
    }
    const cycle = contract.cyclesIssued + 1;

    const existingInvoice = await findExistingCycleInvoice(contract.id, cycle);
    if (existingInvoice) {
        return { invoice: existingInvoice, contract, cycle };
    }

    const invoiceDate = options.invoiceDate || new Date();
    const lineItems = buildInvoiceLineItems(contract);
    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const dueDate = defaultDueDateFromTerms(invoiceDate, contract.paymentTerms);

    const number = await getNextNumber('invoice');
    const id = `INV-${String(number).padStart(4, '0')}`;
    const noteParts: string[] = [];
    noteParts.push(`Cycle ${cycle}${contract.termCycles ? ` of ${contract.termCycles}` : ''} for contract ${contract.displayId} (${contract.title}).`);
    if (contract.notes) noteParts.push(contract.notes);

    const customer = {
        id: contract.clientId || contract.leadId || contract.id,
        name: contract.customerName,
        email: contract.customerEmail || undefined,
        phone: contract.customerPhone || undefined,
        address: contract.customerAddress || undefined,
        clientId: contract.clientId || undefined,
        leadId: contract.leadId || undefined,
        jobId: contract.jobId || undefined,
    };

    const invoice: DocumentData = {
        id,
        number,
        type: 'invoice',
        date: invoiceDate.toISOString(),
        dueDate: dueDate?.toISOString(),
        customer,
        jobId: contract.jobId || undefined,
        lineItems,
        subtotal,
        total: subtotal,
        status: 'draft',
        notes: noteParts.join('\n\n'),
        tags: ['contract', `contract:${contract.id}`, `cycle:${cycle}`],
        createdAt: invoiceDate.toISOString(),
        updatedAt: invoiceDate.toISOString(),
        contractId: contract.id,
        contractCycle: cycle,
        title: `${contract.title} — Cycle ${cycle}${contract.termCycles ? ` of ${contract.termCycles}` : ''}`,
    };

    await saveNewDocument(invoice);

    const newNextDueDate = advanceNextDueDate(contract, contract.nextDueDate);
    let newStatus: ContractStatus = contract.status;
    let newEndDate: Date | null = contract.endDate;
    const totalCycles = contract.termCycles;

    // End-of-term handling. We trigger at every multiple of `termCycles` so
    // repeated renewals stay correct even after several rollovers (the cycle
    // counter is cumulative across renewals).
    const isTermBoundary = totalCycles ? cycle % totalCycles === 0 : false;
    if (totalCycles && isTermBoundary) {
        if (contract.autoRenew) {
            // Extend the end date by another full term so customers see when
            // the next renewal cycle would land.
            const termSpan = contract.intervalCount * totalCycles;
            const baseEnd = newEndDate ?? contract.startDate;
            newEndDate = addInterval(baseEnd, contract.intervalUnit, termSpan);
        } else {
            newStatus = 'ended';
        }
    } else if (!totalCycles && contract.endDate && newNextDueDate > contract.endDate) {
        // Open-ended contract with a hard end date: stop unless auto-renew is on.
        if (contract.autoRenew) {
            newEndDate = addInterval(contract.endDate, contract.intervalUnit, contract.intervalCount);
        } else {
            newStatus = 'ended';
        }
    }

    const updated = await prisma.contract.update({
        where: { id: contract.id },
        data: {
            cyclesIssued: cycle,
            lastIssuedDate: invoiceDate,
            nextDueDate: newNextDueDate,
            status: newStatus,
            endDate: newEndDate,
        },
        include: { lines: true },
    });

    return { invoice, contract: toContractRecord(updated), cycle };
}

export interface SchedulerRunSummary {
    issuedCount: number;
    invoices: Array<{ contractId: string; invoiceId: string; cycle: number }>;
    errors: Array<{ contractId: string; error: string }>;
    contractsConsidered: number;
    skipped: Array<{ contractId: string; reason: string }>;
}

interface SchedulerOptions {
    now?: Date;
    /** When true, scheduler may invoke email send via the provided sender. */
    sendEmail?: (invoice: DocumentData, contract: ContractRecord) => Promise<{ ok: boolean; error?: string }>;
    /** Maximum number of catch-up cycles per contract (default: MAX_CATCHUP_CYCLES). */
    maxCatchUp?: number;
}

export async function runContractScheduler(options: SchedulerOptions = {}): Promise<SchedulerRunSummary> {
    const summary: SchedulerRunSummary = {
        issuedCount: 0,
        invoices: [],
        errors: [],
        contractsConsidered: 0,
        skipped: [],
    };
    if (!isDatabaseConfigured()) {
        summary.errors.push({ contractId: 'global', error: 'Database not configured' });
        return summary;
    }
    const now = options.now ?? new Date();
    const maxCatchUp = options.maxCatchUp ?? MAX_CATCHUP_CYCLES;
    const dueContracts = await getContractsDue(now);
    summary.contractsConsidered = dueContracts.length;

    for (const initial of dueContracts) {
        let contract = initial;
        let issuedThisRun = 0;
        try {
            while (
                contract.status === 'active'
                && contract.nextDueDate <= now
                && issuedThisRun < maxCatchUp
            ) {
                const result = await issueInvoiceFromContract(contract);
                contract = result.contract;
                issuedThisRun += 1;
                summary.invoices.push({ contractId: contract.id, invoiceId: result.invoice.id, cycle: result.cycle });
                summary.issuedCount += 1;

                if (options.sendEmail && contract.autoSend) {
                    const hasUsage = contract.lines.some((line) => line.kind === 'usage');
                    if (hasUsage) {
                        summary.skipped.push({
                            contractId: contract.id,
                            reason: 'Auto-send skipped because the contract has usage lines that need review.',
                        });
                    } else if (!contract.customerEmail) {
                        summary.skipped.push({
                            contractId: contract.id,
                            reason: 'Auto-send skipped because the contract has no customer email.',
                        });
                    } else {
                        const sendResult = await options.sendEmail(result.invoice, contract);
                        if (!sendResult.ok) {
                            summary.errors.push({
                                contractId: contract.id,
                                error: `Auto-send failed: ${sendResult.error || 'unknown error'}`,
                            });
                        }
                    }
                }
            }
            if (issuedThisRun >= maxCatchUp && contract.nextDueDate <= now) {
                summary.skipped.push({
                    contractId: contract.id,
                    reason: `Reached max catch-up cycles (${maxCatchUp}). Run scheduler again to continue.`,
                });
            }
        } catch (error) {
            console.error(`Failed to issue invoice for contract ${contract.id}`, error);
            summary.errors.push({
                contractId: contract.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return summary;
}

export async function getInvoicesForContract(contractId: string): Promise<DocumentData[]> {
    const invoices = await getDocuments('invoice');
    return invoices
        .filter((inv) => inv.contractId === contractId)
        .sort((a, b) => (a.contractCycle ?? 0) - (b.contractCycle ?? 0));
}

export interface ContractReviewItem {
    contract: ContractRecord;
    latestDraftInvoice?: DocumentData;
}

/**
 * Returns contracts whose latest generated invoice is still `draft` AND that
 * have at least one usage line — these are the cycles waiting for an admin
 * to fill in usage quantities before the invoice can be sent.
 */
export async function getContractsNeedingReview(): Promise<ContractReviewItem[]> {
    if (!isDatabaseConfigured()) return [];
    const [contracts, invoices] = await Promise.all([getContracts(), getDocuments('invoice')]);
    const items: ContractReviewItem[] = [];
    for (const contract of contracts) {
        if (contract.status !== 'active') continue;
        const hasUsage = contract.lines.some((line) => line.kind === 'usage');
        if (!hasUsage) continue;
        const draft = invoices
            .filter((inv) => inv.contractId === contract.id && inv.status === 'draft')
            .sort((a, b) => (b.contractCycle ?? 0) - (a.contractCycle ?? 0))[0];
        if (draft) {
            items.push({ contract, latestDraftInvoice: draft });
        }
    }
    return items;
}

export interface ContractCycleProgress {
    cyclesIssued: number;
    totalCycles: number | null;
    progressLabel: string;
}

export function getContractProgress(contract: ContractRecord): ContractCycleProgress {
    if (contract.termCycles) {
        return {
            cyclesIssued: contract.cyclesIssued,
            totalCycles: contract.termCycles,
            progressLabel: `${contract.cyclesIssued} of ${contract.termCycles} cycles issued`,
        };
    }
    return {
        cyclesIssued: contract.cyclesIssued,
        totalCycles: null,
        progressLabel: `${contract.cyclesIssued} cycles issued (open-ended)`,
    };
}

export function summarizeContractCadence(contract: ContractRecord): string {
    const unitLabel = contract.intervalUnit === 'day'
        ? contract.intervalCount === 1 ? 'day' : 'days'
        : contract.intervalUnit === 'month'
            ? contract.intervalCount === 1 ? 'month' : 'months'
            : contract.intervalCount === 1 ? 'year' : 'years';
    const prefix = contract.intervalCount === 1 ? 'Every' : `Every ${contract.intervalCount}`;
    return `${prefix} ${unitLabel}`;
}

export function summarizeRecurringTotal(contract: ContractRecord): number {
    return contract.lines
        .filter((line) => line.kind === 'recurring')
        .reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
}
