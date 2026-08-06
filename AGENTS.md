# AGENTS.md

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint (uses `eslint-config-next` with core-web-vitals + typescript)
- `npm test` / `npm run test:watch` — Vitest (node environment, `@/` path alias)
- `npm run prisma:migrate:dev` — local DB migration
- `npm run prisma:migrate:deploy` — apply pending migrations in prod
- `npm run prisma:generate` — regenerate Prisma client (also runs on `postinstall`)

Run order for verification: **lint → test → build**.

## Setup

1. `cp .env.example .env` — fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, SMTP
2. `docker compose up -d postgres` — Postgres on host port **5433** (not 5432)
3. `npm run prisma:migrate:dev`
4. `npm run dev`
5. Create admin user: `node scripts/seed-admin.js` (email: `admin@cameronmarotto.com`)

**Port alignment:** `APP_PORT` must match `NEXTAUTH_URL` port or auth redirects break.

## Architecture

Single Next.js 16 app (App Router, React 19, React Compiler enabled). Not a monorepo.

### Persistence split

| Data | Storage | Key files |
|---|---|---|
| Auth, Clients, Jobs, Contracts, CalendarEvents, DocumentCounter | PostgreSQL via Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Invoices, Estimates, Quotes, Receipts, Leads | JSON files (local `data/` or remote WebDAV) | `src/lib/data.ts`, `src/lib/webdav.ts` |
| App settings | `data/config/settings.json` | `src/lib/config.ts` |

This hybrid means: document CRUD goes through `src/lib/data.ts` (filesystem/WebDAV), not Prisma. DB records are only the models in the Prisma schema.

### Path alias

`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).

### Key source map

- `src/app/actions.ts` — core server actions for documents and settings
- `src/app/admin/layout.tsx` — admin shell wrapper
- `src/components/AdminShell.tsx` — shared admin nav (sidebar + mobile bottom bar)
- `src/components/NewInvoiceForm.tsx` — shared document editor for all doc types
- `src/components/DocumentPreview.tsx` — preview/print layer
- `src/lib/types.ts` — shared TypeScript types (`DocumentData`, line items, etc.)
- `src/lib/contracts.ts` — recurring contract CRUD and scheduler logic
- `src/lib/calendar.ts` — calendar event logic, recurrence math
- `src/lib/auth.ts` — NextAuth v5 beta setup

### Cron endpoints

- `POST /api/cron/contracts` — contract invoice scheduler
- `POST /api/cron/calendar` — calendar reminder emails
- Both require `X-Cron-Secret` header matching `CRON_SECRET` env var
- Docker sidecar (`cron` service in compose) triggers these on schedule

### Stripe endpoints

- `POST /api/stripe/checkout` — create a Checkout Session for a public invoice share token (full balance, amount, %, or equal split)
- `POST /api/stripe/webhook` — Stripe webhook; records payment + receipt on `checkout.session.completed`
- Requires `STRIPE_SECRET_KEY`; webhook also requires `STRIPE_WEBHOOK_SECRET`
- Shared payment apply logic: `src/lib/invoice-payments.ts`; amount helpers: `src/lib/stripe-checkout.ts`

## Testing

- Vitest in node environment, `@/` alias resolved
- Tests live in `src/lib/__tests__/` — currently `calendar.test.ts`, `stripe-checkout.test.ts`
- No test DB setup required; calendar tests cover recurrence/timezone math; Stripe amount helpers are pure unit tests
- When adding tests that touch Prisma, you need a running Postgres

## Prisma notes

- `npm run prisma:migrate:dev` for local schema changes (creates migration files)
- `npm run prisma:migrate:deploy` in CI/Docker (applies pending migrations)
- Prisma client auto-generates on `npm install` via `postinstall` script
- Deploy workflow has a quirk: resolves a duplicate init migration idempotently before `migrate deploy` (see `.github/workflows/deploy.yml`)

## Docker

- `docker compose up -d --build` — full stack (app on `APP_PORT`, Postgres on 5433, cron sidecar)
- App runs as unprivileged `nextjs` user; `data/` dir pre-created with correct ownership
- `output: "standalone"` in `next.config.ts` for Docker tracing
- Persistent volumes: `marotto_data` (`/app/data`), `postgres_data`

## Gotchas

- Document numbers use atomic `DocumentCounter` table (in DB) when `DATABASE_URL` is set, otherwise fall back to filesystem scanning — don't assume one path
- Settings legacy fallback reads `config/settings.json` if `data/config/settings.json` missing
- `.env*` is gitignored; `.env.example` is the template
- `next-auth` is v5 beta — API may differ from v4 docs
- Admin and non-admin routes overlap for some doc types (e.g. `/invoices/*` and `/admin/invoices/*`); use admin routes for operational workflows
- Document `warranty` and `paymentOverrides` fields live on `DocumentData` in `src/lib/types.ts`, not in the DB
- Stripe Checkout is preferred over pasted Payment Links when `STRIPE_SECRET_KEY` is set; webhook marks invoices paid (do not double-record manually for the same session)
