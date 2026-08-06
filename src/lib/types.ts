export type DocumentType = 'invoice' | 'estimate' | 'quote' | 'receipt' | 'lead';

export type WorkflowStatus = 'backlog' | 'todo' | 'in_progress' | 'done';

export interface LineItem {
    id: string;
    description: string;
    details?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    /** Optional percentage discount applied to this line (0-100). `total` is already net of this. */
    discountPercent?: number;
    /** When true, line is additional scope not yet approved by the client (quotes/estimates). */
    pendingClientApproval?: boolean;
}

/** Mutually exclusive project approach on an estimate/quote (Option A / B). */
export interface DocumentPackage {
    id: string;
    label: string;
    description?: string;
    recommended?: boolean;
    lineItems: LineItem[];
}

/** One alternative inside a material/method choice group. */
export interface DocumentChoice {
    id: string;
    label: string;
    description?: string;
    lineItems: LineItem[];
}

/** Per-section alternatives (e.g. Flooring: Hardwood vs Laminate). */
export interface DocumentChoiceGroup {
    id: string;
    label: string;
    description?: string;
    /** When true (default), a choice must be selected before convert-to-invoice. */
    required?: boolean;
    choices: DocumentChoice[];
}

/**
 * Selected package + choice-group answers.
 * `by: 'client'` is reserved for a future public share-link picker.
 */
export interface DocumentOptionSelection {
    packageId?: string | null;
    choices: Record<string, string>;
    by: 'admin' | 'client';
    at: string;
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
    /** Stripe Checkout Session id — used for webhook idempotency. */
    stripeSessionId?: string;
    /** Stripe PaymentIntent id when available from Checkout. */
    stripePaymentIntentId?: string;
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
    /**
     * Unguessable token used for public client share links (`/d/{shareToken}`).
     * Minted on save; backfilled lazily for older documents.
     */
    shareToken?: string;
    /** Optional grouping key that links this document to a Prisma Job. */
    jobId?: string;
    payments?: PaymentEntry[];
    paidAmount?: number;
    balanceDue?: number;
    /** Set on invoices generated from a recurring service Contract. */
    contractId?: string;
    /** 1-based cycle number within the contract (1 = first invoice issued). */
    contractCycle?: number;
    /** Optional customizable warranty section (invoices). */
    warranty?: DocumentWarranty;
    /** Per-invoice payment method customization (overrides global billing settings). */
    paymentOverrides?: InvoicePaymentOverrides;
    /** Workflow progress label for estimates and quotes (Backlog / To Do / In Progress / Done). */
    workflowStatus?: WorkflowStatus;
    /**
     * Estimated labor hours to complete the work (estimates/quotes).
     * Aggregated onto linked Jobs; not copied to invoices.
     */
    estimatedHours?: number;
    /** Mutually exclusive project packages (estimates/quotes). */
    packages?: DocumentPackage[];
    /** Material/method choice groups applied on top of base + selected package. */
    choiceGroups?: DocumentChoiceGroup[];
    /** Admin (or future client) selection of package and choice-group answers. */
    optionSelection?: DocumentOptionSelection;
}

export interface DocumentWarranty {
    enabled: boolean;
    /** Heading shown above the warranty text. Defaults to "Warranty". */
    title?: string;
    /** Body text, e.g. "1 Year Workmanship Warranty applies to XYZ. Does not include ABC." */
    text: string;
}

export interface InvoicePaymentOverrides {
    /** When true, only `enabledMethods` are shown on this invoice (instead of all globally enabled). */
    customizeMethods?: boolean;
    /** Allowlist of method keys to display when `customizeMethods` is true. */
    enabledMethods?: PaymentMethodKey[];
    /** Stripe payment link specific to this invoice; overrides the global Stripe value. */
    stripeLink?: string;
    /** Optional note shown with the per-invoice Stripe link. */
    stripeNote?: string;
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
    /** Display order across the app (lower shows first). */
    position?: number;
}

export interface BillingConfig {
    checkPayableTo: string;
    paymentInstructions: string;
    paymentMethods: Record<PaymentMethodKey, PaymentMethodEntry>;
}

/** Layout when creating/editing invoices, estimates, quotes, and receipts. */
export type DocumentFormMode = 'guided' | 'full';

// ─── Business identity & branding (white-label) ──────────────────────

/**
 * The business running this installation. Everything here is user-entered in
 * Settings → Business Profile; nothing brand-specific may be hardcoded in
 * components.
 */
export interface BusinessConfig {
    /** Brand/display name shown across the app and on documents. */
    name: string;
    /** Legal name for contract signature lines; falls back to `name`. */
    legalName?: string;
    /** Short tagline shown on the public site hero and metadata. */
    tagline?: string;
    /** Human-formatted phone, e.g. "(570) 555-0100". */
    phoneDisplay?: string;
    /** E.164 phone used for tel: links, e.g. "+15705550100". */
    phoneE164?: string;
    /** Public contact email (also the default outbound From fallback). */
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    /** Human-readable service area, e.g. "Springfield and surrounding communities". */
    serviceArea?: string;
}

export type ThemeAppearance = 'light' | 'dark' | 'system';

export interface BrandingConfig {
    /** Named theme preset id (see src/lib/theme-presets.ts) or 'custom'. */
    themePreset?: string;
    /** Radix Themes accent color name (used when themePreset is 'custom'). */
    accentColor?: string;
    /** Radix Themes gray scale name (used when themePreset is 'custom'). */
    grayColor?: string;
    /** Radix Themes radius: none | small | medium | large | full. */
    radius?: string;
    /** Default appearance for visitors without a stored preference. */
    defaultAppearance?: ThemeAppearance;
    /** Uploaded logo file name under data/branding/, e.g. "logo.png". */
    logoFileName?: string;
    /** Render the uploaded logo on printed documents instead of the text letterhead. */
    showLogoOnDocuments?: boolean;
    /** Letterhead text lines on printed documents; default derives from the business name. */
    letterheadLine1?: string;
    letterheadLine2?: string;
    /** Accent hex used on printed documents (always light paper), e.g. "#1e3a5f". */
    documentAccentColor?: string;
}

/** One service offering shown on the public site and quote form. */
export interface PublicSiteService {
    slug: string;
    /** Value submitted by the quote form's service selector. */
    formValue: string;
    title: string;
    shortTitle: string;
    description: string;
    summary: string;
    highlights: string[];
    idealFor: string[];
    /** Icon name for the services grid (see src/lib/site-icons.ts). */
    icon?: string;
}

export interface PublicSiteTestimonial {
    name: string;
    service: string;
    quote: string;
}

/** A "why choose us" selling point on the public homepage. */
export interface PublicSiteHighlight {
    title: string;
    text: string;
    /** Icon name (see src/lib/site-icons.ts). */
    icon?: string;
}

export interface PublicSiteConfig {
    /** When false, `/` renders a minimal branded card linking to sign-in. */
    enabled: boolean;
    heroHeading?: string;
    heroSubheading?: string;
    highlights?: PublicSiteHighlight[];
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    services?: PublicSiteService[];
    testimonials?: PublicSiteTestimonial[];
}

export interface AppConfig {
    webdavUrl: string;
    webdavUsername: string; // Saved in local storage or env
    webdavPassword?: string; // Ideally not saved in plain text if possible, but for self-hosted we might need to.
    /** Remote folder documents are stored under on the WebDAV server. */
    webdavRootPath?: string;
    lastInvoiceNumber: number;
    lastEstimateNumber: number;
    lastQuoteNumber: number;
    lastReceiptNumber: number;
    billing?: BillingConfig;
    business?: BusinessConfig;
    branding?: BrandingConfig;
    publicSite?: PublicSiteConfig;
    /** IANA timezone for calendar display and form parsing (default: "America/New_York"). */
    businessTimezone?: string;
    /**
     * Document editor layout preference.
     * - guided: one section at a time (Customer → Details → Items → Review)
     * - full: all sections on one page with jump navigation
     */
    documentFormMode?: DocumentFormMode;
}

/** Document types that support reusable presets (excludes leads). */
export type PresetDocumentType = Exclude<DocumentType, 'lead'>;

/**
 * Named, client-agnostic blueprint for new documents.
 * Empty `documentTypes` means the preset applies to all invoice/estimate/quote/receipt forms.
 */
export interface DocumentPreset {
    id: string;
    name: string;
    documentTypes: PresetDocumentType[];
    title?: string;
    notes?: string;
    lineItems: LineItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DocumentPresetInput {
    name: string;
    documentTypes?: PresetDocumentType[];
    title?: string;
    notes?: string;
    lineItems: LineItem[];
}

// ─── Calendar types ───────────────────────────────────────────────────

export type CalendarEventStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
    frequency: RecurrenceFrequency;
    /** Repeat every N units (default 1). */
    interval?: number;
    /** Optional end date (UTC ISO string). */
    until?: string;
    /** Optional max occurrences (alternative to `until`). */
    count?: number;
}

export interface CalendarEventInput {
    title: string;
    description?: string;
    status?: CalendarEventStatus;
    /** Wall-clock start in business timezone (ISO string without offset, e.g. "2026-06-15T09:00"). */
    start: string;
    /** Wall-clock end in business timezone (ISO string without offset). */
    end: string;
    allDay?: boolean;
    location?: string;
    assignee?: string;
    clientId?: string;
    jobId?: string;
    recurrenceRule?: RecurrenceRule;
    /** Minutes before event start to send a reminder. Null = no reminder. */
    reminderMinutesBefore?: number | null;
}

export interface CalendarEventRecord {
    id: string;
    title: string;
    description: string | null;
    status: CalendarEventStatus;
    /** UTC ISO string. */
    start: string;
    /** UTC ISO string. */
    end: string;
    allDay: boolean;
    location: string | null;
    assignee: string | null;
    clientId: string | null;
    jobId: string | null;
    clientName: string | null;
    jobName: string | null;
    recurrenceRule: RecurrenceRule | null;
    reminderMinutesBefore: number | null;
    reminderSentAt: string | null;
    createdAt: string;
    updatedAt: string;
}
