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

1. `cp env.example .env` — fill `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, SMTP
2. `docker compose up -d postgres` — Postgres on host port **5433** (not 5432)
3. `npm run prisma:migrate:dev`
4. `npm run dev`
5. Create the first admin via the in-app wizard at `/setup`, or scripted:
   `ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... node scripts/seed-admin.js`

**Port alignment:** `APP_PORT` must match `NEXTAUTH_URL` port or auth redirects break.

**Build note:** `next build` requires `EMAIL_SERVER` to be set (Auth.js nodemailer provider is constructed at build time). Any syntactically valid value works, e.g. `EMAIL_SERVER=smtp://localhost:1025 npm run build`.

## Architecture

Single Next.js 16 app (App Router, React 19, React Compiler enabled). Not a monorepo.

### Persistence split

| Data | Storage | Key files |
|---|---|---|
| Auth, Clients, Jobs, Contracts, CalendarEvents, DocumentCounter | PostgreSQL via Prisma | `prisma/schema.prisma`, `src/lib/prisma.ts` |
| Invoices, Estimates, Quotes, Receipts, Leads | JSON files (local `data/` or remote WebDAV) | `src/lib/data.ts`, `src/lib/webdav.ts` |
| App settings (incl. business profile, branding, public site) | `data/config/settings.json` | `src/lib/config.ts` |
| Uploaded logo | `data/branding/` (served via `/api/branding/logo`) | `src/app/admin/settings/actions.ts` |

This hybrid means: document CRUD goes through `src/lib/data.ts` (filesystem/WebDAV), not Prisma. DB records are only the models in the Prisma schema.

### White-label branding

The app is fully white-label: business identity, theme, letterhead, and public-site content are configuration, never hardcoded strings.

- `src/lib/branding.ts` is the single accessor (`getBranding()`); components read brand values through it or receive them as props from a server component that did
- `src/lib/theme-presets.ts` — theme presets + Radix color validation; per-visitor light/dark lives in an `appearance` cookie (`src/lib/appearance.ts`), SSR-applied as a class on `<html>` with `Theme appearance="inherit"`
- `src/lib/legacy-defaults.ts` — migration-only: a settings file without a `business` section (pre-white-label install) is seeded with the original Marotto values at read time; fresh installs get neutral defaults
- Printable documents pin a nested `<Theme appearance="light">` — paper is always light regardless of screen theme; document colors flow from `--doc-*` CSS vars

### Path alias

`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).

### Key source map

- `src/app/actions.ts` — core server actions for documents
- `src/app/admin/settings/actions.ts` — sectioned settings saves (business, appearance/logo, public site, billing, documents, storage)
- `src/components/settings/` — tabbed settings UI (shared by `/admin/settings`; `/settings` redirects there)
- `src/app/admin/layout.tsx` — admin shell wrapper
- `src/components/AdminShell.tsx` — shared admin nav (grouped sidebar + mobile bottom bar)
- `src/components/NewInvoiceForm.tsx` — shared document editor for all doc types
- `src/components/DocumentPreview.tsx` — preview/print layer
- `src/lib/types.ts` — shared TypeScript types (`DocumentData`, `BusinessConfig`, etc.)
- `src/lib/branding.ts` — resolved business/branding/public-site accessor
- `src/lib/contracts.ts` — recurring contract CRUD and scheduler logic
- `src/lib/calendar.ts` — calendar event logic, recurrence math (host-timezone independent)
- `src/lib/auth.ts` — NextAuth v5 beta setup
- `src/lib/health.ts` — diagnostics shared by `/api/health` and `/admin/system`
- `src/lib/help-content.ts` — in-app manual content (`/admin/help`)
- `src/app/setup/` — first-run wizard (only while zero users exist)

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

- Vitest in node environment, `@/` alias resolved, `TZ=UTC` pinned in `vitest.config.ts`
- Tests live in `src/lib/__tests__/` — calendar recurrence/timezone math, Stripe amount helpers, payment links, quote intake, config merge/migration (`config.test.ts`), branding resolution (`branding.test.ts`)
- No test DB setup required; when adding tests that touch Prisma, you need a running Postgres

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
- Container names and the Postgres host port come from `STACK_NAME` / `POSTGRES_PORT`; the defaults reproduce the prod values, so plain `docker compose` is unchanged

## Dev instance

Second isolated stack at `dev.marottosolutions.com`. Full guide: `docs/dev-environment.md`.

- Always pass both files: `docker compose -f docker-compose.yml -f docker-compose.dev.yml …`
- Isolation is env-only (`STACK_NAME=marotto-dev`, `APP_PORT=3082`, `POSTGRES_PORT=5434`, `COMPOSE_PROJECT_NAME=marotto-dev`); there is no separate code path
- `APP_ENV` (not `NODE_ENV`) marks an instance non-production — dev runs a production build on purpose. See `src/lib/app-env.ts`
- Non-production effects: DEV banner, `Disallow: /` robots, browser source maps, live Stripe keys rejected
- All dev email goes to a mailpit sink; nothing reaches real clients
- Deploy via `.github/workflows/deploy-dev.yml` (`develop` branch, or `workflow_dispatch` with a `ref` input). Shares the `self-hosted-deploy` concurrency group with prod
- Env template is `env.dev.example` — not a dotfile, because `.env*` is gitignored

## Health endpoint

`GET /api/health` — anonymous returns `{ ok, env, commit, time }`; admin sessions also get database reachability, active document store (WebDAV vs local JSON), numbering strategy, Stripe mode, and the redacted SMTP target. Use it to check which persistence path is live rather than guessing.

## Gotchas

- Document numbers use atomic `DocumentCounter` table (in DB) when `DATABASE_URL` is set, otherwise fall back to filesystem scanning — don't assume one path
- Settings legacy fallback reads `config/settings.json` if `data/config/settings.json` missing; a settings file without a `business` section is seeded with legacy Marotto branding at read time (see `src/lib/legacy-defaults.ts`)
- `.env*` is gitignored; `env.example` is the template (dev uses `env.dev.example`) — deliberately not dotfiles so they can be committed
- `npm run lint` and `npm test` are expected to pass; treat any failure as a regression
- `next-auth` is v5 beta — API may differ from v4 docs
- Admin and non-admin routes overlap for some doc types (e.g. `/invoices/*` and `/admin/invoices/*`); use admin routes for operational workflows
- Document `warranty` and `paymentOverrides` fields live on `DocumentData` in `src/lib/types.ts`, not in the DB
- Stripe Checkout is preferred over pasted Payment Links when `STRIPE_SECRET_KEY` is set; webhook marks invoices paid (do not double-record manually for the same session)
