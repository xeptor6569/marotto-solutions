import { prisma } from '@/lib/prisma';

export interface ClientOption {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
}

export async function getClientOptions(): Promise<ClientOption[]> {
    try {
        return await prisma.client.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
            },
        });
    } catch (error) {
        console.error('Failed to load clients for document form', error);
        return [];
    }
}
