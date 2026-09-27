/**
 * The user manual: day-to-day guides for running the business in the app.
 * Bodies live in `docs/manual/{slug}.md` so they read well on GitHub and render
 * in both the in-app Help (`/admin/help`) and the public docs site
 * (`/docs/manual`). This registry sets order, descriptions, and icons; each
 * title must match the file's `# ` heading (enforced by tests).
 */

export interface HelpTopic {
    slug: string;
    title: string;
    description: string;
    icon: string;
}

export const MANUAL_DIR = 'manual';

export const HELP_TOPICS: HelpTopic[] = [
    {
        slug: 'getting-started',
        title: 'Getting started',
        description: 'First sign-in, finding your way around, and installing the app on your phone.',
        icon: 'sparkles',
    },
    {
        slug: 'first-job',
        title: 'Your first job, start to finish',
        description: 'A walkthrough from new client to paid invoice — the everyday workflow in one place.',
        icon: 'route',
    },
    {
        slug: 'clients-jobs',
        title: 'Clients, jobs & helpers',
        description: 'Contact records, job hubs, field helpers, and time tracking.',
        icon: 'users',
    },
    {
        slug: 'documents',
        title: 'Estimates, quotes, invoices & receipts',
        description: 'The document workflow: creating, options, sharing, converting, and printing.',
        icon: 'fileText',
    },
    {
        slug: 'payments',
        title: 'Payments & Stripe',
        description: 'Payment methods, recording payments, and card payments via Stripe.',
        icon: 'creditCard',
    },
    {
        slug: 'quote-requests',
        title: 'Website quote requests',
        description: 'How requests from your public site arrive, and turning them into work.',
        icon: 'inbox',
    },
    {
        slug: 'contracts',
        title: 'Recurring contracts',
        description: 'Scheduled invoicing for repeat service agreements.',
        icon: 'repeat',
    },
    {
        slug: 'calendar',
        title: 'Calendar & reminders',
        description: 'Scheduling events, recurrence, and reminder emails.',
        icon: 'calendar',
    },
    {
        slug: 'branding-theming',
        title: 'Branding, theming & public site',
        description: 'Make the app and public site yours: identity, colors, logo, content.',
        icon: 'paintbrush',
    },
    {
        slug: 'storage-backups',
        title: 'Storage, backups & import',
        description: 'Where data lives, taking backups, restoring, and importing documents.',
        icon: 'archive',
    },
    {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Diagnosing problems with the System page and common fixes.',
        icon: 'lifeBuoy',
    },
];

export function helpTopicFile(topic: HelpTopic): string {
    return `${MANUAL_DIR}/${topic.slug}.md`;
}

export function getHelpTopic(slug: string): HelpTopic | undefined {
    return HELP_TOPICS.find((topic) => topic.slug === slug);
}

export function getAdjacentTopics(slug: string): { prev: HelpTopic | null; next: HelpTopic | null } {
    const index = HELP_TOPICS.findIndex((topic) => topic.slug === slug);
    if (index === -1) return { prev: null, next: null };
    return {
        prev: index > 0 ? HELP_TOPICS[index - 1] : null,
        next: index < HELP_TOPICS.length - 1 ? HELP_TOPICS[index + 1] : null,
    };
}
