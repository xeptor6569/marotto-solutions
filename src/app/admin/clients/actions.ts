'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ClientFormData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}

export async function getClients() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, clients };
    } catch (error) {
        console.error('Error fetching clients:', error);
        return { success: false, error: 'Failed to fetch clients' };
    }
}

export async function createClient(data: ClientFormData) {
    try {
        const client = await prisma.client.create({
            data,
        });
        revalidatePath('/admin/clients');
        revalidatePath('/admin');
        return { success: true, client };
    } catch (error) {
        console.error('Error creating client:', error);
        return { success: false, error: 'Failed to create client' };
    }
}

export async function updateClient(id: string, data: ClientFormData) {
    try {
        const client = await prisma.client.update({
            where: { id },
            data,
        });
        revalidatePath('/admin/clients');
        revalidatePath('/admin');
        return { success: true, client };
    } catch (error) {
        console.error('Error updating client:', error);
        return { success: false, error: 'Failed to update client' };
    }
}

export async function deleteClient(id: string) {
    try {
        await prisma.client.delete({
            where: { id },
        });
        revalidatePath('/admin/clients');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Error deleting client:', error);
        return { success: false, error: 'Failed to delete client' };
    }
}
