export type DocumentType = 'invoice' | 'estimate' | 'receipt';

export interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Customer {
    id: string; // Could be name-based or uuid
    name: string;
    email?: string;
    address?: string;
    phone?: string;
}

export interface DocumentData {
    id: string; // e.g., INV-0001
    number: number; // 1
    type: DocumentType;
    date: string; // ISO string
    dueDate?: string; // ISO string
    customer: Customer;
    lineItems: LineItem[];
    subtotal: number;
    tax?: number;
    total: number;
    notes?: string;
    status: 'draft' | 'sent' | 'paid' | 'void';
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AppConfig {
    webdavUrl: string;
    webdavUsername: string; // Saved in local storage or env
    webdavPassword?: string; // Ideally not saved in plain text if possible, but for self-hosted we might need to.
    lastInvoiceNumber: number;
    lastEstimateNumber: number;
    lastReceiptNumber: number;
}
