export type DocumentType = 'invoice' | 'estimate' | 'quote' | 'receipt' | 'lead';

export interface LineItem {
    id: string;
    description: string;
    details?: string;
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
    clientId?: string;
}

export type PaymentKind = 'partial' | 'down_payment' | 'final';

export interface PaymentEntry {
    id: string;
    amount: number;
    date: string;
    method?: string;
    notes?: string;
    kind: PaymentKind;
    receiptId?: string;
}

export interface DocumentData {
    id: string; // e.g., INV-0001
    /** Optional short label shown in lists and preview chrome. */
    title?: string;
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
    payments?: PaymentEntry[];
    paidAmount?: number;
    balanceDue?: number;
}

export type PaymentMethodKey =
    | 'cash'
    | 'check'
    | 'zelle'
    | 'cashApp'
    | 'paypal'
    | 'venmo'
    | 'applePay'
    | 'stripe';

export interface PaymentMethodEntry {
    enabled: boolean;
    label: string;
    value?: string;
    note?: string;
    comingSoon?: boolean;
}

export interface BillingConfig {
    checkPayableTo: string;
    paymentInstructions: string;
    paymentMethods: Record<PaymentMethodKey, PaymentMethodEntry>;
}

export interface AppConfig {
    webdavUrl: string;
    webdavUsername: string; // Saved in local storage or env
    webdavPassword?: string; // Ideally not saved in plain text if possible, but for self-hosted we might need to.
    lastInvoiceNumber: number;
    lastEstimateNumber: number;
    lastQuoteNumber: number;
    lastReceiptNumber: number;
    billing?: BillingConfig;
}
