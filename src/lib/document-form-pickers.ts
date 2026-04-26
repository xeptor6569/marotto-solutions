import { getClientOptions } from '@/lib/clients';
import { getLeadOptions } from '@/lib/leads';
import { getJobOptions } from '@/lib/jobs';
import type { ClientOption } from '@/lib/clients';
import type { LeadOption } from '@/lib/leads';
import type { JobOption } from '@/lib/types';

export async function getDocumentFormPickers(): Promise<{ clients: ClientOption[]; leads: LeadOption[]; jobs: JobOption[] }> {
    const [clients, leads, jobs] = await Promise.all([getClientOptions(), getLeadOptions(), getJobOptions()]);
    return { clients, leads, jobs };
}
