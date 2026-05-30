import { getClientOptions } from '@/lib/clients';
import { getLeadOptions } from '@/lib/leads';
import { getJobOptions } from '@/lib/jobs';
import { getAppConfig } from '@/lib/config';
import type { ClientOption } from '@/lib/clients';
import type { LeadOption } from '@/lib/leads';
import type { JobOption, PaymentMethodKey } from '@/lib/types';

export type PaymentMethodOption = { key: PaymentMethodKey; label: string };

export async function getDocumentFormPickers(): Promise<{
    clients: ClientOption[];
    leads: LeadOption[];
    jobs: JobOption[];
    paymentMethods: PaymentMethodOption[];
}> {
    const [clients, leads, jobs, config] = await Promise.all([
        getClientOptions(),
        getLeadOptions(),
        getJobOptions(),
        getAppConfig(),
    ]);
    const paymentMethods = Object.entries(config.billing?.paymentMethods || {})
        .filter(([, method]) => method.enabled)
        .sort((a, b) => (a[1].position ?? 0) - (b[1].position ?? 0))
        .map(([key, method]) => ({
            key: key as PaymentMethodKey,
            label: method.label,
        }));
    return { clients, leads, jobs, paymentMethods };
}
