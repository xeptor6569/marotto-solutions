/**
 * Getting-started checklist for new installs. The dashboard collects signals
 * (settings, env, first records); this decides what is done and where each
 * step lives, so it can be tested without a database.
 */

export interface OnboardingSignals {
    businessName: string;
    hasContactDetails: boolean;
    hasAddress: boolean;
    hasLogo: boolean;
    /** True once the admin changed the Look or color away from the defaults. */
    customizedTheme: boolean;
    emailConfigured: boolean;
    /** Stripe usable, or at least one manual payment method has details. */
    paymentsConfigured: boolean;
    clientCount: number;
    jobCount: number;
    /** Invoices, estimates, or quotes that have left draft. */
    issuedDocumentCount: number;
}

export type OnboardingStepId = 'profile' | 'brand' | 'email' | 'payments' | 'client' | 'job' | 'send';

export interface OnboardingStep {
    id: OnboardingStepId;
    title: string;
    description: string;
    done: boolean;
    href: string;
    cta: string;
}

export interface OnboardingChecklist {
    steps: OnboardingStep[];
    completed: number;
    total: number;
    allDone: boolean;
    /** First step that is not done yet. */
    next: OnboardingStep | null;
}

export function buildOnboardingChecklist(signals: OnboardingSignals): OnboardingChecklist {
    const steps: OnboardingStep[] = [
        {
            id: 'profile',
            title: 'Complete your business profile',
            description: 'Name, phone or email, and address appear on every document you send.',
            done: Boolean(signals.businessName.trim()) && signals.hasContactDetails && signals.hasAddress,
            href: '/admin/settings?tab=business',
            cta: 'Add details',
        },
        {
            id: 'brand',
            title: 'Make it look like you',
            description: 'Upload a logo and pick a Look and color for the app, client pages, and paperwork.',
            done: signals.hasLogo || signals.customizedTheme,
            href: '/admin/settings?tab=appearance',
            cta: 'Choose a look',
        },
        {
            id: 'email',
            title: 'Turn on email sending',
            description: 'Send invoices and sign-in codes from the app. Set EMAIL_SERVER in your environment.',
            done: signals.emailConfigured,
            href: '/admin/system',
            cta: 'Check email setup',
        },
        {
            id: 'payments',
            title: 'Set up how clients pay you',
            description: 'Add Zelle, PayPal, Venmo, or check details, or connect Stripe for card payments.',
            done: signals.paymentsConfigured,
            href: '/admin/settings?tab=billing',
            cta: 'Add payment methods',
        },
        {
            id: 'client',
            title: 'Add your first client',
            description: 'Clients keep contact details handy for every estimate and invoice.',
            done: signals.clientCount > 0,
            href: '/admin/clients',
            cta: 'Add a client',
        },
        {
            id: 'job',
            title: 'Create a job',
            description: 'A job groups the estimate, invoices, time, and files for one piece of work.',
            done: signals.jobCount > 0,
            href: '/admin/jobs/create',
            cta: 'Create a job',
        },
        {
            id: 'send',
            title: 'Send your first estimate or invoice',
            description: 'Clients get a branded link they can view, print, and pay from.',
            done: signals.issuedDocumentCount > 0,
            href: '/admin/invoices/new',
            cta: 'Create an invoice',
        },
    ];
    const completed = steps.filter((step) => step.done).length;
    return {
        steps,
        completed,
        total: steps.length,
        allDone: completed === steps.length,
        next: steps.find((step) => !step.done) ?? null,
    };
}
