import { getClientOptions } from '@/lib/clients';
import { getLeadOptions } from '@/lib/leads';
import type { ClientOption } from '@/lib/clients';
import type { LeadOption } from '@/lib/leads';

export async function getDocumentFormPickers(): Promise<{ clients: ClientOption[]; leads: LeadOption[] }> {
    const [clients, leads] = await Promise.all([getClientOptions(), getLeadOptions()]);
    return { clients, leads };
}
