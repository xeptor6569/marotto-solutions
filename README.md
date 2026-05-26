# Marotto Solutions Platform

Marotto Solutions is a Next.js app with:

- a public website for service discovery and quote intake
- an authenticated admin workspace for day-to-day operations
- document workflows for leads, estimates, quotes, invoices, receipts, jobs, and recurring contracts

This README is intended to be an operational handbook you can come back to when you need a reminder.

## What This App Does

### Public experience

- `/` marketing homepage and quote request intake
- quote submissions create internal lead documents

### Admin workspace

- auth with email magic link or email/password
- full admin workspace at `/admin`
- shared navigation shell across admin pages for desktop and mobile/PWA usage

### Core business workflows

- create, edit, preview, print, and track:
  - leads
  - estimates
  - quotes
  - invoices
  - receipts
- track jobs and link documents to a job
- manage recurring service contracts and issue cycle invoices

## Admin UX and Navigation (Important)

The admin area uses a shared shell across all pages:

- Desktop
  - persistent left sidebar with major sections
  - sticky top bar with quick actions
- Mobile / installed web app
  - fixed bottom navigation for high-frequency sections
  - quick create menu plus a More menu for secondary pages
  - safe-area-aware bottom bar for phones with gesture/home indicators

### Admin section map

- `/admin` dashboard
- `/admin/jobs` jobs list
- `/admin/leads` lead/client documents
- `/admin/clients` Prisma client records
- `/admin/estimates` estimates
- `/admin/quotes` quotes
- `/admin/invoices` invoices
- `/admin/receipts` receipts
- `/admin/contracts` recurring service contracts
- `/admin/import` JSON import
- `/admin/settings` app settings

## Route Map

### Public routes

- `/`
- `/auth/signin`
- `/auth/verify`
- `/auth/error`
- `/contracts/{CTR-XXXX}` public contract preview for client share

### Signed-in non-admin routes

- `/dashboard`
- `/settings`
- `/import`
- `/invoices/*`
- `/estimates/*`
- `/receipts/*`

### Admin routes

- `/admin`
- `/admin/settings`
- `/admin/import`
- `/admin/clients`
- `/admin/jobs/*`
- `/admin/leads/*`
- `/admin/estimates/*`
- `/admin/quotes/*`
- `/admin/invoices/*`
- `/admin/receipts/*`
- `/admin/contracts/*`

### Scheduler endpoint

- `POST /api/cron/contracts` (protected with `X-Cron-Secret`)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Radix Themes + Lucide
- NextAuth v5 beta
- Prisma + PostgreSQL
- WebDAV
- Docker / Docker Compose

## Data and Storage Model

The app uses mixed persistence based on record type.

### Document data (JSON)

Document types include leads, estimates, quotes, invoices, and receipts.

- local fallback folders:
  - `data/invoices`
  - `data/estimates`
  - `data/quotes`
  - `data/receipts`
  - `data/leads`
- optional remote storage:
  - WebDAV under `/MarottoSolutions` (configured in settings)

Key files:

- `src/lib/data.ts`
- `src/lib/webdav.ts`
- `src/lib/types.ts`

### App settings

Settings persist at:

- primary: `data/config/settings.json`
- legacy fallback source: `config/settings.json` (read for migration compatibility)

Key file:

- `src/lib/config.ts`

### Database-backed records

- NextAuth models (`User`, `Account`, `Session`, `VerificationToken`)
- business clients (`Client`)
- service contracts and related scheduling records

Key file:

- `prisma/schema.prisma`

## Environment Variables

Use `.env.example` as your source template.

### Required

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_PORT`

### Email auth

- `EMAIL_SERVER`
- `EMAIL_FROM`

### Contract scheduler

- `CRON_SECRET`
- `CONTRACTS_CRON_SCHEDULE` (optional; defaults to `15 8 * * *`)

### Port alignment rule

If `APP_PORT` changes, keep `NEXTAUTH_URL` aligned to avoid auth callback and redirect issues.

## Local Development

### 1) Install

```bash
npm install
```

### 2) Configure env

```bash
cp .env.example .env
```

Fill in DB, auth secret, and SMTP values.

### 3) Start Postgres

```bash
docker compose up -d postgres
```

Compose exposes Postgres on host `5433`.

### 4) Migrate

```bash
npm run prisma:migrate:dev
```

### 5) Run app

```bash
npm run dev
```

### 6) Configure storage in UI

1. Sign in.
2. Open `/admin/settings`.
3. Fill WebDAV values and save (or leave blank to use local JSON storage).

## Docker Deployment

Bring up full stack:

```bash
docker compose up -d --build
```

Default compose behavior:

- app exposed on host `3081`
- internal app port `3000`
- postgres host `5433`
- persistent data via volumes

## Admin Workflow Playbook (How-To)

Use this section as a practical "what do I click next?" guide.

### Workflow A: Triage new requests

1. Open `/admin`.
2. Check recent clients/leads and recent documents on dashboard cards.
3. Open `/admin/leads` for full lead/client list.
4. Edit lead details and stage as needed.
5. If work is approved, create estimate or quote from admin create menu.

### Workflow B: Estimate -> Quote -> Invoice

1. Create estimate from `Create -> Estimate`.
2. Add detailed scope and line items.
3. Save draft while revising.
4. Create quote when commercial terms are ready.
5. Create invoice when ready to bill.
6. Record payment from invoice flow (receipt generation is supported in payment flow).

### Deposit invoice (percent or fixed)

On any **quote** or **estimate** preview, use **Deposit invoice**:

1. Choose **Percent** (e.g. `50` for 50%) or **Fixed amount** (e.g. `120` for $120).
2. The billing base is the document total, or **agreed scope only** when some lines are marked pending client approval.
3. Click **Create draft invoice** — opens the new invoice in edit mode with one deposit line, notes, and tags (`deposit`, `source:QTE-…`).
4. **Save as Sent**, then **Email** the client from the invoice preview.

### Workflow C: Run job-centric operations

1. Create job in `/admin/jobs/create`.
2. Link leads/docs to that job as you create or edit records.
3. Open `/admin/jobs/{id}` to review:
   - linked leads/documents
   - attachments
   - operational progress for that job

### Workflow D: Recurring contracts

1. Create contract in `/admin/contracts/create`.
2. Configure cadence, term, line items, and auto-send behavior.
3. Use `Run scheduler now` on contracts list for manual cycle issuance.
4. Open contract detail to review generated cycle invoices.
5. If usage lines exist, review/edit draft cycle invoice before send.

### Workflow E: Import legacy JSON docs

1. Go to `/admin/import`.
2. Upload JSON array of documents.
3. Confirm success/error callout.
4. Return to admin list views and verify imported records.

## Settings Guide (When You Forget)

Open `/admin/settings` and use this checklist.

### WebDAV Configuration

- URL: Nextcloud-style WebDAV endpoint
- Username
- Password / app token

Expected behavior:

- save action validates connectivity (when URL/username are present)
- if WebDAV is not configured, app falls back to local JSON storage in `data/`

### Billing Configuration

- checks payable-to value
- global payment instructions text
- per-method controls:
  - enabled toggle
  - value/handle/link field
  - optional note
  - coming-soon toggle

Payment methods supported:

- cash
- check
- zelle
- cash app
- paypal
- venmo
- apple pay
- stripe

## Operational Quick Reference

### Daily startup checklist

1. Confirm app is running.
2. Open `/admin`.
3. Triage leads/clients.
4. Check due/active contracts.
5. Review outstanding invoices and receipts.

### Weekly checklist

1. Run contract scheduler manually from `/admin/contracts` if needed.
2. Review skipped/error scheduler outcomes.
3. Confirm WebDAV settings still connect.
4. Verify backups for DB and data volume.

### If something looks wrong

- Try list page first (`/admin/invoices`, `/admin/estimates`, etc.)
- Then open individual record preview page
- Verify settings in `/admin/settings`
- Check logs for scheduler/email issues

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`

## Key Files

- `src/app/page.tsx` public site and intake
- `src/app/actions.ts` core server actions
- `src/app/admin/layout.tsx` admin layout wrapper
- `src/components/AdminShell.tsx` shared admin navigation shell
- `src/app/admin/page.tsx` admin dashboard
- `src/components/NewInvoiceForm.tsx` shared document editor form
- `src/components/DocumentPreview.tsx` preview/print layer
- `src/lib/auth.ts` auth setup
- `src/lib/data.ts` document storage logic
- `src/lib/config.ts` app settings persistence
- `src/lib/contracts.ts` recurring contract workflows
- `src/lib/types.ts` shared data types
- `prisma/schema.prisma` database schema

## Known Notes

- Admin and non-admin routes overlap for some document types; use admin routes for operational workflows.
- Local JSON storage is valid fallback when WebDAV is not configured.
- Settings writes target `data/config/settings.json` in current runtime.

## License

Private repository for Marotto Solutions.
