import { describe, expect, it } from 'vitest';
import {
    documentBalance,
    documentDisplayStatus,
    isInvoiceOverdue,
    parseDocumentStatusFilter,
    statusDisplay,
} from '@/lib/status-display';

const now = new Date('2026-06-15T12:00:00Z');

function invoice(overrides: Record<string, unknown> = {}) {
    return {
        type: 'invoice' as const,
        status: 'sent' as const,
        total: 500,
        balanceDue: 500,
        paidAmount: 0,
        dueDate: '2026-06-20T00:00:00Z',
        ...overrides,
    };
}

describe('documentDisplayStatus', () => {
    it('flags sent invoices past due with a balance as overdue', () => {
        expect(documentDisplayStatus(invoice({ dueDate: '2026-06-01T00:00:00Z' }), now)).toBe('overdue');
        expect(isInvoiceOverdue(invoice({ dueDate: '2026-06-01T00:00:00Z' }), now)).toBe(true);
    });

    it('part-paid invoices that are not overdue read as partial', () => {
        expect(documentDisplayStatus(invoice({ paidAmount: 100, balanceDue: 400 }), now)).toBe('partial');
    });

    it('drafts, paid, and non-invoices keep their stored status', () => {
        expect(documentDisplayStatus(invoice({ status: 'draft', dueDate: '2026-01-01T00:00:00Z' }), now)).toBe('draft');
        expect(documentDisplayStatus(invoice({ status: 'paid', balanceDue: 0, dueDate: '2026-01-01T00:00:00Z' }), now)).toBe('paid');
        expect(documentDisplayStatus({ ...invoice({ dueDate: '2026-01-01T00:00:00Z' }), type: 'quote' }, now)).toBe('sent');
    });

    it('an invoice without a due date is never overdue', () => {
        expect(isInvoiceOverdue(invoice({ dueDate: undefined }), now)).toBe(false);
    });
});

describe('documentBalance', () => {
    it('is zero for paid/void and falls back to total', () => {
        expect(documentBalance({ status: 'paid', total: 100, balanceDue: 100 })).toBe(0);
        expect(documentBalance({ status: 'sent', total: 250 })).toBe(250);
        expect(documentBalance({ status: 'sent', total: 250, balanceDue: -5 })).toBe(0);
    });
});

describe('statusDisplay', () => {
    it('maps known statuses and title-cases unknown ones', () => {
        expect(statusDisplay('job', 'paused')).toEqual({ label: 'Paused', color: 'amber' });
        expect(statusDisplay('event', 'confirmed').color).toBe('blue');
        expect(statusDisplay('contract', 'on_hold')).toEqual({ label: 'On hold', color: 'gray' });
        expect(statusDisplay('workflow', 'in_progress').label).toBe('In Progress');
    });

    it('parses list filters from the URL safely', () => {
        expect(parseDocumentStatusFilter('overdue')).toBe('overdue');
        expect(parseDocumentStatusFilter('bogus')).toBe('all');
        expect(parseDocumentStatusFilter(undefined)).toBe('all');
    });
});
