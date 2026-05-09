export type DocumentType = 'invoice' | 'estimate' | 'quote' | 'receipt' | 'lead';

export interface LineItem {
    id: string;
    description: string;
    details?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    /** When true, line is additional scope not yet approved by the client (quotes/estimates). */
    pendingClientApproval?: boolean;
}

export interface Customer {
    id: string; // Could be name-based or uuid
    name: string;
    email?: string;
    address?: string;
    phone?: string;
    clientId?: string;
    /** When set, ties this document to a lead record (e.g. for a future client portal). */
    leadId?: string;
    /** Job grouping key for future client portal + document timelines. */
    jobId?: string;
    /** Prospect classification used by the client intake flow. */
    clientStage?: 'lead' | 'potential_client';
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
    /** Optional grouping key that links this document to a Prisma Job. */
    jobId?: string;
    payments?: PaymentEntry[];
    paidAmount?: number;
    balanceDue?: number;
    /** Set on invoices generated from a recurring service Contract. */
    contractId?: string;
    /** 1-based cycle number within the contract (1 = first invoice issued). */
    contractCycle?: number;
}

export type ContractIntervalUnit = 'day' | 'month' | 'year';

export type ContractStatus = 'active' | 'paused' | 'ended' | 'cancelled';

export type ContractLineKind = 'recurring' | 'usage';

export interface ContractLineInput {
    id?: string;
    kind: ContractLineKind;
    description: string;
    details?: string;
    quantity: number;
    unitPrice: number;
    position?: number;
}

export interface ContractInput {
    title: string;
    status?: ContractStatus;
    jobId?: string;
    clientId?: string;
    leadId?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    intervalUnit: ContractIntervalUnit;
    intervalCount: number;
    startDate: string;
    endDate?: string;
    termCycles?: number;
    autoRenew?: boolean;
    autoSend?: boolean;
    paymentTerms?: string;
    notes?: string;
    lines: ContractLineInput[];
}

export interface JobOption {
    id: string;
    name: string;
    status: string;
    clientId?: string | null;
    leadId?: string | null;
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
