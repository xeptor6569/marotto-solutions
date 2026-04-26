import { prisma } from '@/lib/prisma';
import type { JobOption } from '@/lib/types';
import { getDocuments } from '@/lib/data';

export interface JobRecord {
    id: string;
    name: string;
    status: string;
    description: string | null;
    clientId: string | null;
    leadId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobDocumentCounts {
    estimates: number;
    quotes: number;
    invoices: number;
    receipts: number;
    leads: number;
}

export async function getJobs(): Promise<JobRecord[]> {
    return prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function getJobById(id: string): Promise<JobRecord | null> {
    return prisma.job.findUnique({
        where: { id },
    });
}

export async function getJobOptions(params?: {
    clientId?: string;
    leadId?: string;
}): Promise<JobOption[]> {
    const where = {
        ...(params?.clientId ? { clientId: params.clientId } : {}),
        ...(params?.leadId ? { leadId: params.leadId } : {}),
    };
    return prisma.job.findMany({
        where,
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        select: {
            id: true,
            name: true,
            status: true,
            clientId: true,
            leadId: true,
        },
    });
}

export async function createJob(data: {
    name: string;
    description?: string;
    status?: string;
    clientId?: string;
    leadId?: string;
}): Promise<JobRecord> {
    return prisma.job.create({
        data: {
            name: data.name,
            description: data.description || null,
            status: data.status || 'active',
            clientId: data.clientId || null,
            leadId: data.leadId || null,
        },
    });
}

export async function updateJob(id: string, data: {
    name?: string;
    description?: string | null;
    status?: string;
    clientId?: string | null;
    leadId?: string | null;
}): Promise<JobRecord> {
    return prisma.job.update({
        where: { id },
        data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
            ...(data.leadId !== undefined ? { leadId: data.leadId } : {}),
        },
    });
}

export async function getDocumentsByJobId(jobId: string) {
    const [estimates, quotes, invoices, receipts, leads] = await Promise.all([
        getDocuments('estimate'),
        getDocuments('quote'),
        getDocuments('invoice'),
        getDocuments('receipt'),
        getDocuments('lead'),
    ]);
    return {
        estimates: estimates.filter((doc) => doc.jobId === jobId || doc.customer.jobId === jobId),
        quotes: quotes.filter((doc) => doc.jobId === jobId || doc.customer.jobId === jobId),
        invoices: invoices.filter((doc) => doc.jobId === jobId || doc.customer.jobId === jobId),
        receipts: receipts.filter((doc) => doc.jobId === jobId || doc.customer.jobId === jobId),
        leads: leads.filter((doc) => doc.jobId === jobId || doc.customer.jobId === jobId),
    };
}

export async function getJobDocumentCounts(jobId: string): Promise<JobDocumentCounts> {
    const grouped = await getDocumentsByJobId(jobId);
    return {
        estimates: grouped.estimates.length,
        quotes: grouped.quotes.length,
        invoices: grouped.invoices.length,
        receipts: grouped.receipts.length,
        leads: grouped.leads.length,
    };
}
