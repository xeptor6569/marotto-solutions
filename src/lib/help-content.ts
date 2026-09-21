/**
 * The in-app user manual. Content is authored as markdown here so it ships
 * versioned with the code and renders through the shared markdown pipeline.
 * Keep topics task-oriented and accurate to the current UI.
 */

export interface HelpTopic {
    slug: string;
    title: string;
    description: string;
    icon: string;
    body: string;
}

export const HELP_TOPICS: HelpTopic[] = [
    {
        slug: 'getting-started',
        title: 'Getting started',
        description: 'First sign-in, business profile, and installing the app on your phone.',
        icon: 'sparkles',
        body: `
## First steps

1. **Sign in** at \`/auth/signin\` with the admin account created during setup (or via \`scripts/seed-admin.js\`).
2. Open **Settings → Business** and fill in your business name, phone, email, address, and service area. Everything in the app — navigation, printed documents, emails, and the public site — uses these values.
3. Pick a look under **Settings → Appearance**: choose a theme preset, upload your logo, and set the letterhead used on printed documents.
4. Review **Settings → Billing** to enable the payment methods you accept and set payment instructions shown on invoices.

## Install as an app on your phone

The admin works best installed as an app:

- **iPhone / iPad:** open the site in Safari, tap the Share button, then **Add to Home Screen**.
- **Android:** open the site in Chrome and choose **Install app** from the menu.

The installed app opens straight to the dashboard, keeps you signed in for 30 days, and works in your chosen light/dark theme.

## Light and dark mode

Use the sun/moon toggle in the top bar to switch between light, dark, or follow-your-device. Each person's choice is remembered on their own device; the site-wide default lives in **Settings → Appearance**.
`,
    },
    {
        slug: 'documents',
        title: 'Estimates, quotes, invoices & receipts',
        description: 'The document workflow: creating, sharing, converting, and printing.',
        icon: 'fileText',
        body: `
## The document flow

A typical job moves through: **estimate or quote → invoice → receipt.**

- **Estimates** and **quotes** describe proposed work. They support packages (Option A / Option B), material choice groups, and lines pending client approval. Track their pipeline on the board views (Backlog → To Do → In Progress → Done).
- **Invoices** bill for the work. They carry payment methods, due dates, payments, and balance tracking.
- **Receipts** confirm money received. Recording a payment on an invoice can create the receipt automatically.

Use **Convert** on an estimate or quote to turn it into an invoice (selected options carry over), or **Create deposit invoice** to bill a percentage or fixed amount up front.

## Creating documents

Use the **Create** menu (top bar on desktop, center button on the phone nav). The editor has two layouts — pick yours in **Settings → Documents**:

- **Guided flow:** one step at a time (Customer → Details → Items → Review). Best on phones.
- **Full page:** everything on one page with jump navigation. Best on desktop.

**Presets** (Tools → Presets) store reusable line-item templates. On any document you can also use **Save as preset**.

## Numbering

Document numbers are issued automatically. With a database connected, numbering is atomic and safe across concurrent saves; without one, the app scans existing files for the highest number.

## Sharing and printing

Every document has an unguessable **share link** (\`/d/{token}\`). Use **Share** to copy or send it — clients can view, print, and (for invoices) pay online without signing in. Use **Email** to send the link from the app when email is configured, or through your own mail app.

**Print / Save PDF** produces a clean letterhead document — your branding, no app chrome — in both light and dark mode.
`,
    },
    {
        slug: 'payments',
        title: 'Payments & Stripe',
        description: 'Payment methods, recording payments, and card payments via Stripe.',
        icon: 'creditCard',
        body: `
## Payment methods

**Settings → Billing** controls which payment methods appear on invoices (cash, check, Zelle, Cash App, PayPal, Venmo, Apple Pay, Stripe), their order, handles/links, and notes. Individual invoices can override the global list from the invoice editor.

## Recording payments

Open an invoice and record a payment with its amount, date, method, and kind (partial, down payment, final). The invoice tracks paid amount and balance due, and can create a matching receipt automatically. "Mark paid (no payment recorded)" exists for bookkeeping-only cases.

## Card payments with Stripe

With \`STRIPE_SECRET_KEY\` and \`STRIPE_WEBHOOK_SECRET\` set on the server, shared invoices get a **Pay with card** flow powered by Stripe Checkout:

- Clients can pay the full balance, a custom amount, a percentage, or an equal split.
- When Stripe confirms the payment, the webhook records it on the invoice, marks it paid when the balance reaches zero, and creates a receipt — do not record the same payment again manually.

Check **Tools → System** to confirm Stripe is configured (live vs test mode) and the webhook secret is present. Setup details are in the API reference.
`,
    },
    {
        slug: 'contracts',
        title: 'Recurring contracts',
        description: 'Scheduled invoicing for repeat service agreements.',
        icon: 'repeat',
        body: `
## What contracts do

A **contract** describes recurring work — a cadence (every N days/months/years), line items, and a customer. The scheduler generates each cycle's invoice automatically when it comes due.

- **Recurring lines** bill the same quantity every cycle.
- **Usage lines** are billed as-used: the generated invoice arrives as a draft and waits in the **Cycles awaiting review** queue on the dashboard until you fill in quantities.
- With **auto-send** enabled, cycle invoices without usage lines are emailed to the customer automatically.

Contracts can be paused, resumed, ended, or cancelled from the contract page, and each contract shows its generated invoice history and progress through the term.

## The scheduler

The scheduler runs via \`POST /api/cron/contracts\` (the bundled Docker stack calls it daily; see the API reference for running it from your own cron). You can also trigger a run manually from the Contracts page.

A printable **service agreement** with your letterhead and signature lines is available on every contract, with its own share link for the customer.
`,
    },
    {
        slug: 'calendar',
        title: 'Calendar & reminders',
        description: 'Scheduling events, recurrence, and reminder emails.',
        icon: 'calendar',
        body: `
## Events

The calendar (requires a database) tracks scheduled work: title, time or all-day, location, assignee, and optional links to a client and job. Events move through **scheduled → confirmed → completed** (or cancelled).

Recurring events support daily, weekly, or monthly repetition with an optional end date or occurrence count.

All times display in your **business timezone** (Settings → Business), regardless of the server's clock.

## Reminders

Give an event a reminder (minutes before start) and the reminder endpoint emails the operator when the window arrives. Reminders send once per event.

Reminders are delivered by \`POST /api/cron/calendar\` — the bundled Docker stack calls it hourly. The recipient is \`OPERATOR_EMAIL\` (falling back to the From address). The dashboard's **Upcoming This Week** card shows the next few days at a glance.
`,
    },
    {
        slug: 'clients-jobs',
        title: 'Clients, jobs & helpers',
        description: 'Contact records, job hubs, field helpers, and time tracking.',
        icon: 'users',
        body: `
## Clients

**Clients** holds everyone you work with, including prospects from the public quote form (marked as prospects with their request captured in notes). Quote submissions with a known email update the existing record instead of duplicating it.

## Jobs

A **job** groups everything for one piece of work: linked estimates, quotes, invoices, and receipts, plus attachments (photos, PDFs up to 20MB) and time tracking. Create documents from a job page to link them automatically, and give estimates/quotes an **estimated hours** value to compare against tracked time.

## Helpers

**Helpers** tracks field workers who assist on jobs: their rates, hours, and payouts. Record payouts against a helper and review the totals on their page.
`,
    },
    {
        slug: 'storage-backups',
        title: 'Storage, backups & import',
        description: 'Where data lives, taking backups, restoring, and importing documents.',
        icon: 'archive',
        body: `
## Where your data lives

The app uses two stores:

- **PostgreSQL** (when \`DATABASE_URL\` is set): clients, jobs, helpers, contracts, calendar events, sign-in accounts, and the document number counter.
- **Document files** (JSON): invoices, estimates, quotes, and receipts — either on the server's local \`data/\` volume or on a remote **WebDAV/Nextcloud** share configured in **Settings → Storage** (including the remote folder name).

**Tools → System** shows which storage mode is active right now.

## Backups

**Tools → Backup** downloads a single \`.tar.gz\` containing database tables, all document files, job attachments, and settings. Restoring uploads the same archive back — existing records with matching ids are updated.

Take a backup before upgrades, and store copies somewhere other than the server itself.

## Import

**Tools → Import** accepts a JSON array of documents (for migrating from another system) and can migrate legacy lead records into client records.
`,
    },
    {
        slug: 'branding-theming',
        title: 'Branding, theming & public site',
        description: 'Make the app and public site yours: identity, colors, logo, content.',
        icon: 'paintbrush',
        body: `
## Business profile

**Settings → Business** is the single source of your identity — name, legal name, tagline, phone, email, address, service area, and timezone. Nothing brand-specific is hardcoded: change it here and the whole app follows, including printed documents and outgoing email.

## Appearance

**Settings → Appearance** controls the look:

- **Theme presets** change the accent color, gray scale, and corner rounding everywhere; or pick custom values.
- **Default appearance** sets light/dark/system for new visitors; everyone can still toggle for themselves.
- **Logo** uploads appear in the admin sidebar, sign-in page, public site header — and optionally on printed documents instead of the text letterhead.
- **Letterhead** lines and the **document accent color** shape printed invoices, estimates, quotes, receipts, and contracts. Documents always print light-on-white regardless of screen theme.

## Public site

**Settings → Public Site** manages the marketing homepage: hero text, search-engine metadata, "why choose us" points, your service catalog (each service gets a homepage card, a detail page, and a quote-form option), and testimonials. Sections hide automatically when empty.

Prefer no public site? Turn it off and your homepage becomes a simple branded card with a sign-in link.
`,
    },
    {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Diagnosing problems with the System page and common fixes.',
        icon: 'lifeBuoy',
        body: `
## Start at the System page

**Tools → System** shows live diagnostics with fix hints: database connectivity, active document storage, email configuration, Stripe mode, cron secret, and URLs. Most "why isn't X working" questions are answered there.

## Common issues

- **Sign-in redirects fail or loop:** \`NEXTAUTH_URL\` must exactly match the address you open the app on (scheme, host, and port).
- **No sign-in code / emails not arriving:** \`EMAIL_SERVER\` is missing or wrong, or mail is going to a test sink — the System page's Email card shows which.
- **Clients / jobs / calendar missing:** those features need \`DATABASE_URL\`. Documents still work without it, but numbering falls back to filesystem scanning.
- **Card payments not recorded on invoices:** the Stripe webhook is not configured — set \`STRIPE_WEBHOOK_SECRET\` and point a Stripe webhook at \`/api/stripe/webhook\`.
- **Contract invoices not generating / reminders not sending:** the cron endpoints are not being called or \`CRON_SECRET\` is missing. See the API reference for scheduling.

## For integrations

The **API reference** (linked from the System page) documents every endpoint — health checks for uptime monitoring, cron endpoints, Stripe, and backups — with example commands.
`,
    },
];

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
