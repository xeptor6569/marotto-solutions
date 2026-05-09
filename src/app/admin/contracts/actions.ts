'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
    createContract,
    deleteContract,
    cancelContract,
    endContract,
    issueInvoiceFromContract,
    getContractById,
    pauseContract,
    resumeContract,
    runContractScheduler,
    updateContract,
} from '@/lib/contracts';
import type {
    ContractInput,
    ContractIntervalUnit,
    ContractLineInput,
    ContractLineKind,
    ContractStatus,
    DocumentData,
} from '@/lib/types';
import { sendContractInvoiceEmail } from '@/lib/email';

interface ContractFormResult {
    success: boolean;
    error?: string;
    contractId?: string;
}

function asIntervalUnit(value: string | null | undefined): ContractIntervalUnit {
    if (value === 'day' || value === 'year') return value;
    return 'month';
}

function asStatus(value: string | null | undefined): ContractStatus | undefined {
    if (value === 'active' || value === 'paused' || value === 'ended' || value === 'cancelled') return value;
    return undefined;
}

function asLineKind(value: string | null | undefined): ContractLineKind {
    return value === 'usage' ? 'usage' : 'recurring';
}

function parseLines(formData: FormData): ContractLineInput[] {
    const lines: ContractLineInput[] = [];
    let i = 0;
    while (formData.has(`lines[${i}][description]`)) {
        const description = (formData.get(`lines[${i}][description]`) as string) || '';
        if (description.trim().length > 0) {
            lines.push({
                kind: asLineKind(formData.get(`lines[${i}][kind]`) as string | null),
                description,
                details: ((formData.get(`lines[${i}][details]`) as string) || '').trim() || undefined,
                quantity: Number(formData.get(`lines[${i}][quantity]`) || 0),
                unitPrice: Number(formData.get(`lines[${i}][unitPrice]`) || 0),
                position: i,
            });
        }
        i += 1;
    }
    return lines;
}

function parseContractFormInput(formData: FormData): ContractInput {
    const startDate = ((formData.get('startDate') as string) || '').trim();
    const endDateRaw = ((formData.get('endDate') as string) || '').trim();
    const termCyclesRaw = ((formData.get('termCycles') as string) || '').trim();
    return {
        title: ((formData.get('title') as string) || '').trim(),
        status: asStatus(formData.get('status') as string | null),
        jobId: ((formData.get('jobId') as string) || '').trim() || undefined,
        clientId: ((formData.get('clientId') as string) || '').trim() || undefined,
        leadId: ((formData.get('leadId') as string) || '').trim() || undefined,
        customerName: ((formData.get('customerName') as string) || '').trim(),
        customerEmail: ((formData.get('customerEmail') as string) || '').trim() || undefined,
        customerPhone: ((formData.get('customerPhone') as string) || '').trim() || undefined,
        customerAddress: ((formData.get('customerAddress') as string) || '').trim() || undefined,
        intervalUnit: asIntervalUnit(formData.get('intervalUnit') as string | null),
        intervalCount: Number(formData.get('intervalCount') || 1) || 1,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDateRaw || undefined,
        termCycles: termCyclesRaw ? Number(termCyclesRaw) : undefined,
        autoRenew: formData.has('autoRenew'),
        autoSend: formData.has('autoSend'),
        paymentTerms: ((formData.get('paymentTerms') as string) || '').trim() || undefined,
        notes: ((formData.get('notes') as string) || '').trim() || undefined,
        lines: parseLines(formData),
    };
}

function revalidateContractPaths(contractId?: string) {
    revalidatePath('/admin');
    revalidatePath('/admin/contracts');
    revalidatePath('/dashboard');
    if (contractId) {
        revalidatePath(`/admin/contracts/${contractId}`);
    }
}

export async function createContractFormAction(formData: FormData) {
    const input = parseContractFormInput(formData);
    if (!input.title) {
        const params = new URLSearchParams({ error: 'Contract title is required' });
        redirect(`/admin/contracts/create?${params.toString()}`);
    }
    if (!input.customerName) {
        const params = new URLSearchParams({ error: 'Customer name is required' });
        redirect(`/admin/contracts/create?${params.toString()}`);
    }
    let contractId: string | null = null;
    try {
        const created = await createContract(input);
        contractId = created.id;
    } catch (error) {
        console.error('Failed to create contract', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const params = new URLSearchParams({ error: message });
        redirect(`/admin/contracts/create?${params.toString()}`);
    }
    revalidateContractPaths(contractId || undefined);
    redirect(`/admin/contracts/${contractId}`);
}

export async function updateContractFormAction(formData: FormData) {
    const id = ((formData.get('id') as string) || '').trim();
    if (!id) {
        const params = new URLSearchParams({ error: 'Missing contract id' });
        redirect(`/admin/contracts?${params.toString()}`);
    }
    const input = parseContractFormInput(formData);
    if (!input.title || !input.customerName) {
        const params = new URLSearchParams({ error: 'Title and customer name are required' });
        redirect(`/admin/contracts/${id}/edit?${params.toString()}`);
    }
    try {
        await updateContract(id, input);
    } catch (error) {
        console.error(`Failed to update contract ${id}`, error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const params = new URLSearchParams({ error: message });
        redirect(`/admin/contracts/${id}/edit?${params.toString()}`);
    }
    revalidateContractPaths(id);
    redirect(`/admin/contracts/${id}`);
}

export async function deleteContractAction(input: { id: string }): Promise<ContractFormResult> {
    const id = input.id?.trim();
    if (!id) return { success: false, error: 'Missing contract id' };
    try {
        await deleteContract(id);
        revalidateContractPaths(id);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete contract', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

async function changeStatus(
    id: string,
    handler: (id: string) => Promise<unknown>,
): Promise<ContractFormResult> {
    if (!id) return { success: false, error: 'Missing contract id' };
    try {
        await handler(id);
        revalidateContractPaths(id);
        return { success: true };
    } catch (error) {
        console.error('Failed to change contract status', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export async function pauseContractAction(input: { id: string }) {
    return changeStatus(input.id, pauseContract);
}

export async function resumeContractAction(input: { id: string }) {
    return changeStatus(input.id, resumeContract);
}

export async function endContractAction(input: { id: string }) {
    return changeStatus(input.id, endContract);
}

export async function cancelContractAction(input: { id: string }) {
    return changeStatus(input.id, cancelContract);
}

export interface IssueNextResult {
    success: boolean;
    error?: string;
    invoiceId?: string;
    cycle?: number;
}

export async function issueNextInvoiceAction(input: { id: string; force?: boolean }): Promise<IssueNextResult> {
    const id = input.id?.trim();
    if (!id) return { success: false, error: 'Missing contract id' };
    try {
        const contract = await getContractById(id);
        if (!contract) return { success: false, error: 'Contract not found' };
        const result = await issueInvoiceFromContract(contract, { force: !!input.force });
        revalidateContractPaths(id);
        revalidatePath('/admin/invoices');
        revalidatePath(`/admin/invoices/${result.invoice.id}`);
        return { success: true, invoiceId: result.invoice.id, cycle: result.cycle };
    } catch (error) {
        console.error('Failed to issue invoice from contract', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}

export interface RunSchedulerResult {
    success: boolean;
    error?: string;
    issuedCount?: number;
    contractsConsidered?: number;
    errors?: Array<{ contractId: string; error: string }>;
    skipped?: Array<{ contractId: string; reason: string }>;
}

export async function runContractSchedulerAction(): Promise<RunSchedulerResult> {
    try {
        const summary = await runContractScheduler({
            now: new Date(),
            sendEmail: async (invoice: DocumentData) => {
                try {
                    const result = await sendContractInvoiceEmail(invoice);
                    return result;
                } catch (err) {
                    const message = err instanceof Error ? err.message : 'unknown error';
                    return { ok: false, error: message };
                }
            },
        });
        revalidatePath('/admin');
        revalidatePath('/admin/contracts');
        revalidatePath('/admin/invoices');
        revalidatePath('/dashboard');
        return {
            success: true,
            issuedCount: summary.issuedCount,
            contractsConsidered: summary.contractsConsidered,
            errors: summary.errors,
            skipped: summary.skipped,
        };
    } catch (error) {
        console.error('Scheduler run failed', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
    }
}
