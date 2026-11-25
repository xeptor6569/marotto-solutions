'use server';

import { getClients } from '@/app/admin/clients/actions';
import { getDocuments } from '@/lib/data';
import { getContracts } from '@/lib/contracts';
import { getJobs } from '@/lib/jobs';
import { requireAdminAction } from '@/lib/require-admin-session';
import {
    clientSearchHit,
    contractSearchHit,
    documentSearchHit,
    jobSearchHit,
    type AdminSearchHit,
} from '@/lib/smart-search';

export async function searchAdminRecords(): Promise<
    { success: true; hits: AdminSearchHit[] } | { success: false; error: string }
> {
    const gate = await requireAdminAction();
    if (!gate.ok) return { success: false, error: gate.error };

    try {
        const [clientsResult, jobs, contracts, invoices, estimates, quotes, receipts] = await Promise.all([
            getClients(),
            getJobs(),
            getContracts(),
            getDocuments('invoice'),
            getDocuments('estimate'),
            getDocuments('quote'),
            getDocuments('receipt'),
        ]);

        const clients = clientsResult.success && clientsResult.clients ? clientsResult.clients : [];
        const clientNames = new Map(clients.map((client) => [client.id, client.name]));

        const hits: AdminSearchHit[] = [
            ...clients.map((client) => clientSearchHit(client)),
            ...jobs.map((job) => jobSearchHit({
                id: job.id,
                name: job.name,
                description: job.description,
                status: job.status,
                clientName: job.clientId ? clientNames.get(job.clientId) ?? null : null,
            })),
            ...contracts.map((contract) => contractSearchHit(contract)),
            ...invoices.map((doc) => documentSearchHit(doc)),
            ...estimates.map((doc) => documentSearchHit(doc)),
            ...quotes.map((doc) => documentSearchHit(doc)),
            ...receipts.map((doc) => documentSearchHit(doc)),
        ];

        return { success: true, hits };
    } catch (error) {
        console.error('Admin search failed', error);
        return { success: false, error: 'Search is unavailable right now.' };
    }
}
