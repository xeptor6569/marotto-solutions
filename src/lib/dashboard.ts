import { formatInTimeZone } from 'date-fns-tz';
import { documentBalance, isInvoiceOverdue } from './status-display';
import type { CalendarEventRecord, DocumentData } from './types';

/**
 * Pure builders for the dashboard: money summary, the ranked "needs
 * attention" queue, and schedule grouping. The page gathers data; these decide
 * what matters, so the rules are unit-testable.
 */

const DAY_MS = 86_400_000;

// ─── Money ────────────────────────────────────────────────────────────

export interface MoneySummary {
    outstanding: number;
    openCount: number;
    overdue: number;
    overdueCount: number;
    collected: number;
    /** Sent estimates and quotes still waiting on the client. */
    pipeline: number;
    pipelineCount: number;
}

/** Cash received this month: dated payment entries, plus paid invoices without payment records (approximated by update date). */
export function collectedThisMonth(invoices: DocumentData[], now: Date): number {
    const year = now.getFullYear();
    const month = now.getMonth();
    const inMonth = (iso: string) => {
        const d = new Date(iso);
        return d.getFullYear() === year && d.getMonth() === month;
    };
    let total = 0;
    for (const invoice of invoices) {
        if (invoice.status === 'void') continue;
        const payments = invoice.payments ?? [];
        if (payments.length > 0) {
            for (const payment of payments) {
                if (payment.date && inMonth(payment.date)) total += payment.amount;
            }
        } else if (invoice.status === 'paid' && inMonth(invoice.updatedAt || invoice.date)) {
            total += invoice.total;
        }
    }
    return total;
}

export function summarizeMoney(
    invoices: DocumentData[],
    proposals: DocumentData[],
    now: Date,
): MoneySummary {
    const open = invoices.filter((inv) => inv.status === 'sent');
    const overdue = open.filter((inv) => isInvoiceOverdue(inv, now));
    const waiting = proposals.filter((doc) => doc.status === 'sent');
    return {
        outstanding: open.reduce((sum, inv) => sum + documentBalance(inv), 0),
        openCount: open.length,
        overdue: overdue.reduce((sum, inv) => sum + documentBalance(inv), 0),
        overdueCount: overdue.length,
        collected: collectedThisMonth(invoices, now),
        pipeline: waiting.reduce((sum, doc) => sum + (doc.total || 0), 0),
        pipelineCount: waiting.length,
    };
}

// ─── Needs attention ──────────────────────────────────────────────────

export type AttentionGroup = 'collect' | 'send' | 'follow-up' | 'contracts' | 'leads';

export type AttentionKind =
    | 'overdue'
    | 'due-soon'
    | 'draft'
    | 'awaiting-reply'
    | 'contract-review'
    | 'contract-due'
    | 'prospect';

export type AttentionSeverity = 'high' | 'medium' | 'low';

export interface AttentionItem {
    id: string;
    kind: AttentionKind;
    group: AttentionGroup;
    severity: AttentionSeverity;
    title: string;
    subtitle?: string;
    /** Short timing note, e.g. "12 days late". */
    meta?: string;
    amount?: number;
    href: string;
    contact?: { phone?: string; email?: string };
    /** Public share token, for a one-tap "copy pay link". */
    shareToken?: string;
}

export const ATTENTION_GROUP_LABELS: Record<AttentionGroup, string> = {
    collect: 'Collect payment',
    send: 'Ready to send',
    'follow-up': 'Follow up',
    contracts: 'Contracts',
    leads: 'New leads',
};

const GROUP_ORDER: AttentionGroup[] = ['collect', 'contracts', 'send', 'follow-up', 'leads'];
const SEVERITY_ORDER: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 };

export interface AttentionContract {
    id: string;
    displayId: string;
    title: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    nextDueDate: Date | string;
}

export interface AttentionInput {
    invoices: DocumentData[];
    estimates: DocumentData[];
    quotes: DocumentData[];
    contractsDue: AttentionContract[];
    reviewQueue: { contract: AttentionContract; latestDraftInvoice?: Pick<DocumentData, 'id' | 'contractCycle'> | null }[];
    prospects: { id: string; name: string; email?: string | null; phone?: string | null; notes?: string | null; createdAt: Date | string }[];
    now: Date;
    /** Sent proposals older than this get a follow-up nudge (default 7). */
    followUpAfterDays?: number;
    /** Open invoices due within this many days are flagged (default 3). */
    dueSoonDays?: number;
}

function wholeDaysBetween(earlier: Date, later: Date): number {
    return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function plural(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function docTitle(doc: DocumentData): string {
    return doc.title?.trim() || doc.customer.name || doc.id;
}

function docHref(doc: DocumentData): string {
    return `/admin/${doc.type}s/${doc.id}`;
}

function contactOf(doc: DocumentData): AttentionItem['contact'] {
    const phone = doc.customer.phone?.trim();
    const email = doc.customer.email?.trim();
    return phone || email ? { ...(phone ? { phone } : {}), ...(email ? { email } : {}) } : undefined;
}

const TYPE_WORD: Record<string, string> = { invoice: 'Invoice', estimate: 'Estimate', quote: 'Quote' };

export function buildAttentionItems(input: AttentionInput): AttentionItem[] {
    const { now } = input;
    const followUpAfter = input.followUpAfterDays ?? 7;
    const dueSoon = input.dueSoonDays ?? 3;
    const items: (AttentionItem & { rank: number })[] = [];
    const reviewInvoiceIds = new Set(
        input.reviewQueue.map((entry) => entry.latestDraftInvoice?.id).filter(Boolean) as string[],
    );

    for (const inv of input.invoices) {
        if (inv.status !== 'sent' || !inv.dueDate) continue;
        const balance = documentBalance(inv);
        if (balance <= 0) continue;
        const due = new Date(inv.dueDate);
        if (isInvoiceOverdue(inv, now)) {
            const late = Math.max(1, wholeDaysBetween(due, now));
            items.push({
                id: `overdue:${inv.id}`,
                kind: 'overdue',
                group: 'collect',
                severity: 'high',
                title: docTitle(inv),
                subtitle: `${inv.customer.name} · ${inv.id}`,
                meta: `${plural(late, 'day')} late`,
                amount: balance,
                href: docHref(inv),
                contact: contactOf(inv),
                shareToken: inv.shareToken,
                rank: -late,
            });
        } else {
            const daysLeft = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
            if (daysLeft <= dueSoon) {
                items.push({
                    id: `due:${inv.id}`,
                    kind: 'due-soon',
                    group: 'collect',
                    severity: 'medium',
                    title: docTitle(inv),
                    subtitle: `${inv.customer.name} · ${inv.id}`,
                    meta: daysLeft <= 0 ? 'Due today' : `Due in ${plural(daysLeft, 'day')}`,
                    amount: balance,
                    href: docHref(inv),
                    contact: contactOf(inv),
                    shareToken: inv.shareToken,
                    rank: daysLeft,
                });
            }
        }
    }

    for (const doc of [...input.invoices, ...input.estimates, ...input.quotes]) {
        if (doc.status !== 'draft' || reviewInvoiceIds.has(doc.id)) continue;
        const since = new Date(doc.updatedAt || doc.date);
        const age = Math.max(0, wholeDaysBetween(since, now));
        items.push({
            id: `draft:${doc.id}`,
            kind: 'draft',
            group: 'send',
            severity: doc.type === 'invoice' ? 'medium' : 'low',
            title: docTitle(doc),
            subtitle: `${TYPE_WORD[doc.type] ?? 'Document'} ${doc.id} · ${doc.customer.name}`,
            meta: age === 0 ? 'Drafted today' : `Draft for ${plural(age, 'day')}`,
            amount: doc.total,
            href: `${docHref(doc)}/edit`,
            contact: contactOf(doc),
            rank: -age,
        });
    }

    for (const doc of [...input.estimates, ...input.quotes]) {
        if (doc.status !== 'sent') continue;
        const since = new Date(doc.updatedAt || doc.date);
        const age = wholeDaysBetween(since, now);
        if (age < followUpAfter) continue;
        items.push({
            id: `followup:${doc.id}`,
            kind: 'awaiting-reply',
            group: 'follow-up',
            severity: 'medium',
            title: docTitle(doc),
            subtitle: `${TYPE_WORD[doc.type]} ${doc.id} · ${doc.customer.name}`,
            meta: `Sent ${plural(age, 'day')} ago`,
            amount: doc.total,
            href: docHref(doc),
            contact: contactOf(doc),
            shareToken: doc.shareToken,
            rank: -age,
        });
    }

    for (const { contract, latestDraftInvoice } of input.reviewQueue) {
        items.push({
            id: `review:${contract.id}`,
            kind: 'contract-review',
            group: 'contracts',
            severity: 'high',
            title: `${contract.displayId} — ${contract.title}`,
            subtitle: latestDraftInvoice
                ? `Fill in usage on draft ${latestDraftInvoice.id}${latestDraftInvoice.contractCycle ? ` (cycle ${latestDraftInvoice.contractCycle})` : ''}`
                : contract.customerName,
            meta: 'Needs quantities',
            href: latestDraftInvoice ? `/admin/invoices/${latestDraftInvoice.id}/edit` : `/admin/contracts/${contract.id}`,
            rank: 0,
        });
    }

    const reviewed = new Set(input.reviewQueue.map((entry) => entry.contract.id));
    for (const contract of input.contractsDue) {
        if (reviewed.has(contract.id)) continue;
        const due = new Date(contract.nextDueDate);
        const late = Math.max(0, wholeDaysBetween(due, now));
        items.push({
            id: `contract-due:${contract.id}`,
            kind: 'contract-due',
            group: 'contracts',
            severity: 'medium',
            title: `${contract.displayId} — ${contract.title}`,
            subtitle: contract.customerName,
            meta: late === 0 ? 'Cycle due today' : `Cycle due ${plural(late, 'day')} ago`,
            href: `/admin/contracts/${contract.id}`,
            contact: contract.customerPhone || contract.customerEmail
                ? { phone: contract.customerPhone || undefined, email: contract.customerEmail || undefined }
                : undefined,
            rank: -late,
        });
    }

    for (const prospect of input.prospects) {
        const age = Math.max(0, wholeDaysBetween(new Date(prospect.createdAt), now));
        items.push({
            id: `prospect:${prospect.id}`,
            kind: 'prospect',
            group: 'leads',
            severity: 'low',
            title: prospect.name,
            subtitle: prospect.notes?.trim() || 'Quote request',
            meta: age === 0 ? 'Today' : `${plural(age, 'day')} ago`,
            href: '/admin/clients',
            contact: prospect.phone || prospect.email
                ? { phone: prospect.phone || undefined, email: prospect.email || undefined }
                : undefined,
            rank: age,
        });
    }

    return items
        .sort((a, b) =>
            GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
            || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
            || a.rank - b.rank)
        .map((item) => {
            const { rank, ...rest } = item;
            void rank;
            return rest;
        });
}

export function groupAttentionItems(items: AttentionItem[]): { group: AttentionGroup; label: string; items: AttentionItem[] }[] {
    return GROUP_ORDER
        .map((group) => ({ group, label: ATTENTION_GROUP_LABELS[group], items: items.filter((item) => item.group === group) }))
        .filter((section) => section.items.length > 0);
}

// ─── Schedule ─────────────────────────────────────────────────────────

export interface ScheduleDay {
    key: 'today' | 'tomorrow';
    label: string;
    events: CalendarEventRecord[];
}

/** Today's and tomorrow's events in the business timezone (cancelled ones dropped). */
export function groupScheduleByDay(events: CalendarEventRecord[], timezone: string, now: Date): ScheduleDay[] {
    const todayKey = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
    const tomorrowKey = formatInTimeZone(new Date(now.getTime() + DAY_MS), timezone, 'yyyy-MM-dd');
    const byKey = (key: string) => events
        .filter((event) => event.status !== 'cancelled')
        .filter((event) => {
            const startKey = formatInTimeZone(new Date(event.start), timezone, 'yyyy-MM-dd');
            const endKey = formatInTimeZone(new Date(new Date(event.end).getTime() - 1), timezone, 'yyyy-MM-dd');
            return startKey <= key && key <= endKey;
        })
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return [
        { key: 'today', label: 'Today', events: byKey(todayKey) },
        { key: 'tomorrow', label: 'Tomorrow', events: byKey(tomorrowKey) },
    ];
}

export function greetingFor(now: Date, timezone: string): string {
    const hour = Number(formatInTimeZone(now, timezone, 'H'));
    if (hour < 5) return 'Working late';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

/** Most recently touched documents across types, newest first. */
export function recentDocuments(docs: DocumentData[], limit = 5): DocumentData[] {
    return [...docs]
        .sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
        .slice(0, limit);
}
