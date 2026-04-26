import { getDocuments } from '@/lib/data';

export interface LeadOption {
    /** Lead document id, e.g. LEAD-0001 */
    id: string;
    number: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

export async function getLeadOptions(): Promise<LeadOption[]> {
    try {
        const leads = await getDocuments('lead');
        return leads
            .map((doc) => ({
                id: doc.id,
                number: doc.number,
                name: doc.customer.name,
                email: doc.customer.email ?? null,
                phone: doc.customer.phone ?? null,
                address: doc.customer.address ?? null,
            }))
            .sort((a, b) => a.number - b.number);
    } catch (error) {
        console.error('Failed to load leads for document form', error);
        return [];
    }
}
