import { describe, expect, it } from 'vitest';
import {
    buildAttentionItems,
    collectedThisMonth,
    greetingFor,
    groupAttentionItems,
    groupScheduleByDay,
    recentDocuments,
    summarizeMoney,
    type AttentionInput,
} from '@/lib/dashboard';
import type { CalendarEventRecord, DocumentData } from '@/lib/types';

const now = new Date('2026-06-15T15:00:00Z');
const day = 86_400_000;
const daysAgo = (n: number) => new Date(now.getTime() - n * day).toISOString();
const daysAhead = (n: number) => new Date(now.getTime() + n * day).toISOString();

function doc(overrides: Partial<DocumentData>): DocumentData {
    return {
        id: 'INV-0001',
        number: 1,
        type: 'invoice',
        date: daysAgo(10),
        customer: { id: 'c1', name: 'Dana', phone: '(555) 010-2030', email: 'dana@example.com' },
        lineItems: [],
        subtotal: 100,
        total: 100,
        status: 'sent',
        tags: [],
        createdAt: daysAgo(10),
        updatedAt: daysAgo(10),
        ...overrides,
    };
}

function input(overrides: Partial<AttentionInput>): AttentionInput {
    return { invoices: [], estimates: [], quotes: [], contractsDue: [], reviewQueue: [], prospects: [], now, ...overrides };
}

describe('summarizeMoney', () => {
    it('splits outstanding, overdue, and pipeline', () => {
        const summary = summarizeMoney(
            [
                doc({ id: 'A', total: 300, balanceDue: 200, dueDate: daysAgo(2) }),
                doc({ id: 'B', total: 100, dueDate: daysAhead(5) }),
                doc({ id: 'C', status: 'draft', total: 999 }),
                doc({ id: 'D', status: 'paid', total: 50 }),
            ],
            [doc({ id: 'Q', type: 'quote', total: 400 }), doc({ id: 'E', type: 'estimate', status: 'draft', total: 70 })],
            now,
        );
        expect(summary).toMatchObject({
            outstanding: 300,
            openCount: 2,
            overdue: 200,
            overdueCount: 1,
            pipeline: 400,
            pipelineCount: 1,
        });
    });

    it('collected counts dated payments this month and undocumented paid invoices', () => {
        const invoices = [
            doc({ status: 'sent', payments: [{ id: 'p1', amount: 40, date: daysAgo(1), kind: 'partial' }, { id: 'p2', amount: 10, date: daysAgo(60), kind: 'partial' }] }),
            doc({ id: 'B', status: 'paid', total: 75, updatedAt: daysAgo(3) }),
            doc({ id: 'C', status: 'void', total: 500, payments: [{ id: 'p3', amount: 500, date: daysAgo(1), kind: 'final' }] }),
        ];
        expect(collectedThisMonth(invoices, now)).toBe(115);
    });
});

describe('buildAttentionItems', () => {
    it('ranks overdue invoices first, most late on top, with contact and pay link', () => {
        const items = buildAttentionItems(input({
            invoices: [
                doc({ id: 'LATE3', dueDate: daysAgo(3), shareToken: 'tok3' }),
                doc({ id: 'LATE12', dueDate: daysAgo(12) }),
                doc({ id: 'SOON', dueDate: daysAhead(2) }),
                doc({ id: 'LATER', dueDate: daysAhead(20) }),
            ],
        }));
        expect(items.map((i) => i.id)).toEqual(['overdue:LATE12', 'overdue:LATE3', 'due:SOON']);
        expect(items[0].meta).toBe('12 days late');
        expect(items[1].shareToken).toBe('tok3');
        expect(items[0].contact).toEqual({ phone: '(555) 010-2030', email: 'dana@example.com' });
        expect(items[2].meta).toBe('Due in 2 days');
    });

    it('nudges proposals sent over a week ago and lists drafts', () => {
        const items = buildAttentionItems(input({
            quotes: [
                doc({ id: 'Q-OLD', type: 'quote', updatedAt: daysAgo(9) }),
                doc({ id: 'Q-NEW', type: 'quote', updatedAt: daysAgo(2) }),
            ],
            estimates: [doc({ id: 'E-DRAFT', type: 'estimate', status: 'draft', updatedAt: daysAgo(0) })],
        }));
        expect(items.map((i) => i.id)).toEqual(['draft:E-DRAFT', 'followup:Q-OLD']);
        expect(items[0]).toMatchObject({ group: 'send', meta: 'Drafted today', href: '/admin/estimates/E-DRAFT/edit' });
        expect(items[1]).toMatchObject({ group: 'follow-up', meta: 'Sent 9 days ago' });
    });

    it('does not double-list contract cycle drafts or reviewed contracts', () => {
        const contract = { id: 'k1', displayId: 'CTR-1', title: 'Lawn care', customerName: 'Ridgeview', nextDueDate: daysAgo(1) };
        const items = buildAttentionItems(input({
            invoices: [doc({ id: 'INV-DRAFT', status: 'draft' })],
            reviewQueue: [{ contract, latestDraftInvoice: { id: 'INV-DRAFT', contractCycle: 3 } }],
            contractsDue: [contract, { ...contract, id: 'k2', displayId: 'CTR-2' }],
        }));
        expect(items.map((i) => i.id)).toEqual(['review:k1', 'contract-due:k2']);
        expect(items[0].href).toBe('/admin/invoices/INV-DRAFT/edit');
        expect(items[0].subtitle).toContain('cycle 3');
    });

    it('groups sections in a stable order', () => {
        const items = buildAttentionItems(input({
            prospects: [{ id: 'p1', name: 'Priya', createdAt: daysAgo(0) }],
            invoices: [doc({ dueDate: daysAgo(1) })],
        }));
        expect(groupAttentionItems(items).map((s) => s.group)).toEqual(['collect', 'leads']);
    });
});

describe('groupScheduleByDay', () => {
    const event = (id: string, start: string, end: string, status: CalendarEventRecord['status'] = 'scheduled') => ({
        id, title: id, description: null, status, start, end, allDay: false, location: null, assignee: null,
        clientId: null, jobId: null, clientName: null, jobName: null, recurrenceRule: null,
        reminderMinutesBefore: null, reminderSentAt: null, createdAt: start, updatedAt: start,
    });

    it('buckets by business-timezone day and drops cancelled events', () => {
        // 15:00Z is 11:00 in New York; 03:00Z the next day is still "today" there.
        const days = groupScheduleByDay([
            event('late-today', '2026-06-16T02:00:00Z', '2026-06-16T03:00:00Z'),
            event('tomorrow', '2026-06-16T14:00:00Z', '2026-06-16T15:00:00Z'),
            event('cancelled', '2026-06-15T18:00:00Z', '2026-06-15T19:00:00Z', 'cancelled'),
        ], 'America/New_York', now);
        expect(days[0].events.map((e) => e.id)).toEqual(['late-today']);
        expect(days[1].events.map((e) => e.id)).toEqual(['tomorrow']);
    });
});

describe('greetingFor / recentDocuments', () => {
    it('greets by business-local hour', () => {
        expect(greetingFor(now, 'America/New_York')).toBe('Good morning');
        expect(greetingFor(now, 'Asia/Tokyo')).toBe('Working late');
    });

    it('orders by last update', () => {
        const list = recentDocuments([
            doc({ id: 'old', updatedAt: daysAgo(5) }),
            doc({ id: 'new', updatedAt: daysAgo(1) }),
        ], 1);
        expect(list.map((d) => d.id)).toEqual(['new']);
    });
});
