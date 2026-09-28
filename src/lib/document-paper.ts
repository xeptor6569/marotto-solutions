import type { ResolvedBranding, ResolvedBusiness } from './branding-core';
import type { BillingConfig, DocumentData, PaymentMethodEntry, PaymentMethodKey } from './types';

/**
 * Everything the printable document ("paper") needs besides the document
 * itself. Serializable, so a server page can hand it to the client editor for
 * the live preview.
 */
export interface DocumentPaperContext {
    business: ResolvedBusiness;
    branding: Pick<ResolvedBranding, 'letterhead' | 'logoUrl' | 'showLogoOnDocuments' | 'documentAccentColor'>;
    billing: {
        paymentMethods: Partial<BillingConfig['paymentMethods']>;
        paymentInstructions: string;
        checkPayableTo: string;
    };
    /** Stripe Checkout is usable on this install. */
    stripeConfigured: boolean;
}

/**
 * Payment methods shown on an invoice: the enabled Settings methods, with the
 * per-invoice Stripe link and method allow-list applied.
 */
export function buildInvoicePaymentMethods(
    methods: Partial<BillingConfig['paymentMethods']>,
    doc: Pick<DocumentData, 'paymentOverrides'>,
    stripeConfigured: boolean,
): Array<[PaymentMethodKey, PaymentMethodEntry]> {
    const overrides = doc.paymentOverrides;

    let entries = (Object.entries(methods) as Array<[PaymentMethodKey, PaymentMethodEntry | undefined]>)
        .filter((entry): entry is [PaymentMethodKey, PaymentMethodEntry] => Boolean(entry[1]))
        .map(([key, method]) => [key, { ...method }] as [PaymentMethodKey, PaymentMethodEntry]);

    // Per-invoice Stripe link overrides the global Stripe configuration.
    if (overrides?.stripeLink) {
        const stripeIdx = entries.findIndex(([key]) => key === 'stripe');
        const baseStripe: Partial<PaymentMethodEntry> = stripeIdx >= 0 ? entries[stripeIdx][1] : { label: 'Stripe', position: 99 };
        const overridden: PaymentMethodEntry = {
            ...baseStripe,
            enabled: true,
            comingSoon: false,
            label: baseStripe.label || 'Stripe',
            value: overrides.stripeLink,
            note: overrides.stripeNote || baseStripe.note,
        };
        if (stripeIdx >= 0) entries[stripeIdx] = ['stripe', overridden];
        else entries.push(['stripe', overridden]);
    }

    // When Stripe Checkout is configured, surface Stripe even without a pasted link.
    if (stripeConfigured) {
        const stripeIdx = entries.findIndex(([key]) => key === 'stripe');
        if (stripeIdx >= 0) {
            entries[stripeIdx] = ['stripe', { ...entries[stripeIdx][1], comingSoon: false }];
        }
    }

    entries.sort((a, b) => (a[1].position ?? 0) - (b[1].position ?? 0));
    entries = entries.filter(([, method]) => method.enabled);

    if (overrides?.customizeMethods && Array.isArray(overrides.enabledMethods)) {
        const allow = new Set(overrides.enabledMethods);
        entries = entries.filter(
            ([key]) => allow.has(key) || (key === 'stripe' && (!!overrides.stripeLink || stripeConfigured)),
        );
    }

    return entries;
}
