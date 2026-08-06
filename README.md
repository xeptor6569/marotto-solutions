# Self-Hosted Business Back-Office

A white-label, self-hostable web app for running a small service business: estimates, quotes, invoices, receipts, clients, jobs, recurring contracts, a work calendar — plus an optional public marketing site with quote intake. Built with Next.js and designed to be operated by one person on one server.

Everything brand-specific is configuration: set your business name, logo, colors, letterhead, services, and content in the admin settings and the entire app — UI, printed documents, emails, and public site — follows.

## Features

### Back-office (`/admin`)

- **Documents:** estimates → quotes → invoices → receipts, with conversion, deposit invoices, per-line discounts, packages/option groups, warranty text, presets, and print-ready letterhead output
- **Payments:** configurable payment methods (cash, check, Zelle, Cash App, PayPal, Venmo, Apple Pay, Stripe), payment recording with automatic receipts, and Stripe Checkout on shared invoices (full balance, amount, percent, or split)
- **Clients & jobs:** client records (public quote requests become prospects automatically), job hubs linking documents, attachments, and time tracking, plus field helpers with payout tracking
- **Recurring contracts:** cadence-based invoice generation with auto-send, usage lines with a review queue, and printable service agreements
- **Calendar:** timed/all-day/recurring events tied to clients and jobs, business-timezone aware, with email reminders
- **Sharing:** every document gets an unguessable share link clients can view, print, and pay from — no client accounts needed
- **Operations:** dashboard with money KPIs (outstanding, overdue, collected), full backup/restore as one archive, JSON import, System Health diagnostics, API reference, and an in-app manual (`/admin/help`)
- **Mobile-first PWA:** installable on a phone home screen, bottom navigation, card layouts, and no iOS focus-zoom

### White-label & theming

- **Business profile:** name, legal name, tagline, phone, email, address, service area — used everywhere
- **Appearance:** light/dark/system per visitor, six theme presets (or custom accent/gray/radius), logo upload, letterhead text, and document accent color
- **Public site:** optional marketing homepage with configurable hero, selling points, service catalog (each service gets its own page + quote-form option), testimonials, and SEO metadata — or switch it off for a minimal sign-in card

## Quick start (Docker)

```bash
git clone <this repo> && cd <repo>
cp env.example .env        # fill in NEXTAUTH_SECRET, NEXTAUTH_URL, EMAIL_SERVER, CRON_SECRET
docker compose up -d --build
```

Then open the app (default `http://localhost:3081`) — you'll land on the **first-run wizard** (`/setup`) to create your admin account, name your business, and pick a theme. After that, fill in the rest under **Settings**.

Default compose behavior:

- app on host port `APP_PORT` (default `3081`), Postgres on `POSTGRES_PORT` (default `5433`)
- persistent volumes for the database and the `data/` directory (documents, settings, logo, attachments)
- a cron sidecar that triggers the contract scheduler daily and calendar reminders hourly
- container names prefixed by `STACK_NAME`, so a second instance can run on the same host

## Local development

```bash
npm install
cp env.example .env               # set DATABASE_URL to the host port (5433)
docker compose up -d postgres
npm run prisma:migrate:dev
npm run dev
```

Visit `http://localhost:3000/setup` to create the first admin (or run `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/seed-admin.js`).

Verification order: `npm run lint` → `npm test` → `npm run build`. Note: `next build` requires `EMAIL_SERVER` to be set (the Auth.js mail provider is constructed at build time).

## Environment variables

`env.example` is the annotated template. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres (clients, jobs, contracts, calendar, accounts, numbering) |
| `NEXTAUTH_SECRET` | yes | Auth.js session secret |
| `NEXTAUTH_URL` | yes | Exact public URL of the app (must match `APP_PORT`) |
| `APP_PORT` | compose | Published host port (default `3081`) |
| `EMAIL_SERVER` | recommended | SMTP for sign-in codes, notifications, invoice sending |
| `EMAIL_FROM` | optional | From address (falls back to the configured business email) |
| `ADMIN_NOTIFICATION_EMAIL` | optional | Quote-request notifications (default `EMAIL_FROM`) |
| `OPERATOR_EMAIL` | optional | Calendar reminder recipient (default `EMAIL_FROM`) |
| `CRON_SECRET` | recommended | Auth for the cron endpoints |
| `CONTRACTS_CRON_SCHEDULE` / `CALENDAR_CRON_SCHEDULE` | optional | Sidecar cadence (default daily 08:15 / hourly) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | optional | Card payments via Stripe Checkout + webhook |
| `APP_ENV` | optional | `production` \| `dev` \| `local` (non-production guardrails) |
| `STACK_NAME` / `POSTGRES_PORT` | optional | Multi-instance compose naming/ports |
| `NEXT_PUBLIC_SITE_URL` | optional | Public site URL when it differs from `NEXTAUTH_URL` |

## Configuration (in-app)

All business configuration lives in **Settings** (`/admin/settings`), persisted to `data/config/settings.json`:

- **Business** — identity used across the app, documents, and emails; business timezone
- **Appearance** — theme preset or custom colors, default light/dark, logo, letterhead, document accent
- **Public Site** — enable/disable, hero, SEO, selling points, services, testimonials
- **Billing** — payment methods, order, handles/links, payment instructions
- **Documents** — guided vs full-page editor
- **Storage** — local `data/` volume (default) or remote WebDAV/Nextcloud, including the remote folder name

## Data model

Two stores, by design:

| Data | Storage |
|---|---|
| Accounts, clients, jobs, helpers, contracts, calendar, document counter | PostgreSQL (Prisma — `prisma/schema.prisma`) |
| Invoices, estimates, quotes, receipts, leads | JSON files: local `data/` or WebDAV (`src/lib/data.ts`) |
| Settings, uploaded logo | `data/config/settings.json`, `data/branding/` |

Document numbering is atomic via the database when `DATABASE_URL` is set, with a filesystem-scan fallback otherwise. **Tools → Backup** exports everything (DB tables + documents + attachments + settings) as one `.tar.gz` and restores from the same archive.

## Integrations & monitoring

Documented in-app at **Tools → System → API reference**:

- `GET /api/health` — liveness for uptime monitors (anonymous) + full diagnostics (admin); rendered as the **System Health** page
- `POST /api/cron/contracts`, `POST /api/cron/calendar` — schedulers, authenticated with `X-Cron-Secret`
- `POST /api/stripe/checkout`, `POST /api/stripe/webhook` — card payments
- `GET /api/backup` — full backup download (admin session)

## Dev instance

The repo supports a second isolated stack for testing branches against real-shaped data (separate DB, volumes, ports, mail captured by a sink). See [docs/dev-environment.md](docs/dev-environment.md).

```bash
cp env.dev.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Radix Themes · NextAuth v5 · Prisma + PostgreSQL · WebDAV · Vitest · Docker Compose

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` / `npm test` / `npm run test:watch`
- `npm run prisma:generate` / `prisma:migrate:dev` / `prisma:migrate:deploy` / `prisma:studio`
- `node scripts/seed-admin.js` — scripted admin creation (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `ADMIN_NAME`)

## License

Private repository.
