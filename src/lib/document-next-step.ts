import { documentBalance, isInvoiceOverdue } from './status-display';
import type { MoneyFormatter } from './money';
import type { DocumentData } from './types';

const DAY_MS = 86_400_000;

export type NextStepTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export interface DocumentNextStep {
    tone: NextStepTone;
    /** One line: where the document stands and what to do next. */
    message: string;
}

function days(n: number): string {
    return `${n} day${n === 1 ? '' : 's'}`;
}

function shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Status line shown above a document on its admin page. */
export function documentNextStep(doc: DocumentData, money: MoneyFormatter, now: Date = new Date()): DocumentNextStep {
    if (doc.status === 'void') {
        return { tone: 'neutral', message: 'Void. Kept for your records; the client link still shows it as void.' };
    }
    if (doc.status === 'draft') {
        return doc.type === 'receipt'
            ? { tone: 'neutral', message: 'Draft receipt. Mark it sent or share the link when ready.' }
            : { tone: 'info', message: 'Draft. The client has not seen this yet — send it when it looks right.' };
    }

    if (doc.type === 'invoice') {
        const balance = documentBalance(doc);
        if (doc.status === 'paid' || balance <= 0) {
            const lastPayment = [...(doc.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
            return {
                tone: 'success',
                message: lastPayment?.date ? `Paid in full · last payment ${shortDate(lastPayment.date)}.` : 'Paid in full.',
            };
        }
        if (isInvoiceOverdue(doc, now)) {
            const late = Math.max(1, Math.floor((now.getTime() - new Date(doc.dueDate as string).getTime()) / DAY_MS));
            return {
                tone: 'danger',
                message: `Overdue by ${days(late)} · ${money(balance)} outstanding. Send a reminder or record a payment.`,
            };
        }
        const paid = doc.paidAmount ?? 0;
        const due = doc.dueDate
            ? (() => {
                const left = Math.ceil((new Date(doc.dueDate).getTime() - now.getTime()) / DAY_MS);
                return left <= 0 ? 'due today' : `due in ${days(left)}`;
            })()
            : 'no due date';
        return paid > 0
            ? { tone: 'warning', message: `Part paid · ${money(balance)} left of ${money(doc.total)}, ${due}.` }
            : { tone: 'info', message: `Sent · ${money(balance)} ${due}.` };
    }

    if (doc.type === 'estimate' || doc.type === 'quote') {
        const since = Math.max(0, Math.floor((now.getTime() - new Date(doc.updatedAt || doc.date).getTime()) / DAY_MS));
        const when = since === 0 ? 'today' : `${days(since)} ago`;
        return {
            tone: since >= 7 ? 'warning' : 'info',
            message: `Sent ${when} · waiting on the client. Convert it to an invoice once they approve.`,
        };
    }

    return { tone: 'success', message: doc.status === 'paid' ? 'Payment received.' : 'Sent to the client.' };
}
