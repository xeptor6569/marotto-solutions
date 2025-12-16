'use server';

import { saveAppConfig, getAppConfig } from '@/lib/config';
import { AppConfig, DocumentData, LineItem, Customer, DocumentType } from '@/lib/types';
import { checkConnection } from '@/lib/webdav';
import { saveNewDocument } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function saveSettingsAction(formData: FormData) {
    const url = formData.get('webdavUrl') as string;
    const username = formData.get('webdavUsername') as string;
    const password = formData.get('webdavPassword') as string;

    const configUpdate: Partial<AppConfig> = {
        webdavUrl: url,
        webdavUsername: username,
        webdavPassword: password, // Note: Storing plain text password locally. Ideal? No. Functional for self-hosted? Yes.
    };

    // Verify connection
    const isValid = await checkConnection(configUpdate as AppConfig, password);
    if (!isValid) {
        return { success: false, error: "Failed to connect to WebDAV with these credentials." };
    }

    await saveAppConfig(configUpdate);
    revalidatePath('/');
    return { success: true };
}

export async function createInvoiceAction(formData: FormData) {
    const number = Number(formData.get('number'));
    const date = formData.get('date') as string;
    const dueDate = formData.get('dueDate') as string;
    const type = (formData.get('type') as string) as DocumentType || 'invoice';

    const customer: Customer = {
        id: crypto.randomUUID(),
        name: formData.get('customerName') as string,
        email: formData.get('customerEmail') as string,
        address: formData.get('customerAddress') as string,
    };

    // Parse items from flat form data
    // items[0][description], items[0][quantity]...
    const items: LineItem[] = [];
    let i = 0;
    while (formData.has(`items[${i}][description]`)) {
        items.push({
            id: crypto.randomUUID(),
            description: formData.get(`items[${i}][description]`) as string,
            quantity: Number(formData.get(`items[${i}][quantity]`)),
            unitPrice: Number(formData.get(`items[${i}][unitPrice]`)),
            total: Number(formData.get(`items[${i}][quantity]`)) * Number(formData.get(`items[${i}][unitPrice]`))
        });
        i++;
    }

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const total = subtotal; // Add tax logic if needed

    // ID Prefix
    const prefix = type === 'invoice' ? 'INV' : type === 'estimate' ? 'EST' : 'RCT';

    const doc: DocumentData = {
        id: `${prefix}-${String(number).padStart(4, '0')}`,
        number,
        type,
        date,
        dueDate,
        customer,
        lineItems: items,
        subtotal,
        total,
        status: 'draft',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        await saveNewDocument(doc);
    } catch (e: any) {
        console.error("Failed to save invoice", e);
        // In a real app we would return error state, but since we are redirecting we throw or handle differently.
        // If we use useActionState in the form, we can return { error: ... }
        // But for this simple form action redirect:
        throw new Error("Failed to save: " + e.message);
    }

    revalidatePath('/');
    redirect('/');
}
