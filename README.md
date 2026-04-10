# Marotto Solutions Web Platform

Marotto Solutions is a Next.js app that combines a public-facing services site with authenticated business workflows for quotes, invoices, estimates, receipts, leads, clients, and document previews.

## What The App Does

### Public website
- Presents Marotto Solutions service offerings on the homepage.
- Collects quote requests through a client-facing form.
- Converts quote requests into internal `lead` documents through a server action.

### Authenticated workspace
- Supports sign-in with either email magic links or email/password.
- Provides a lightweight signed-in dashboard at `/dashboard`.
- Provides a fuller admin workspace at `/admin` for operational workflows.

### Document workflows
- Create, edit, preview, print, and manage:
  - invoices
  - estimates
  - receipts
  - leads
- Stores business documents as JSON, either locally or in WebDAV.
- Supports richer estimate content with multi-line project details and line-item detail text.
- Supports explicit invoice and estimate save states such as draft, sent/finalized, and paid.

### Operations
- Manage WebDAV settings from the UI.
- Import receipt data from dedicated import screens.
- Manage clients with Prisma/Postgres-backed records.

## Current Route Map

### Public routes
- `/` - marketing homepage and quote request form
- `/auth/signin` - sign-in page
- `/auth/verify` - magic link verification request page
- `/auth/error` - auth error page

### Signed-in routes
- `/dashboard` - quick document dashboard
- `/settings` - WebDAV/app settings
- `/import` - import flow
- `/invoices/*`, `/estimates/*`, `/receipts/*` - non-admin document routes

### Admin routes
- `/admin` - admin dashboard with recent documents and leads
- `/admin/settings` - settings
- `/admin/import` - import flow
- `/admin/clients` - client management
- `/admin/invoices/*` - invoice list, create, preview, edit
- `/admin/estimates/*` - estimate list, create, preview, edit
- `/admin/receipts/*` - receipt list, create, preview, edit

## Authentication

Authentication is implemented with `next-auth` and Prisma-backed auth models.

### Providers
- Email magic link via Nodemailer
- Email/password credentials via bcrypt

### Key files
- `src/lib/auth.ts` - NextAuth configuration and callbacks
- `src/app/api/auth/[...nextauth]/route.ts` - auth route handler
- `src/app/auth/signin/page.tsx` - sign-in UI
- `prisma/schema.prisma` - Prisma auth and client models

### Important auth notes
- Sessions use JWT strategy.
- The sign-in UI defaults successful auth flows back into the admin area.
- Keep `NEXTAUTH_URL` aligned with the actual runtime port.
- There is no proxy-based auth middleware in the current app. Older README references to `src/proxy.ts` are no longer accurate.

## Storage Model

The app uses two different persistence models depending on the kind of data.

### Business documents
Invoices, estimates, receipts, and leads are stored as JSON `DocumentData` records.

- Local fallback storage:
  - `data/invoices`
  - `data/estimates`
  - `data/receipts`
  - `data/leads`
- Remote storage:
  - WebDAV folder rooted at `/MarottoSolutions`

Relevant files:
- `src/lib/data.ts`
- `src/lib/types.ts`
- `src/lib/webdav.ts`

### App settings
WebDAV settings are stored in:

- `config/settings.json`

Relevant file:
- `src/lib/config.ts`

### Database-backed records
Authentication records and clients are stored in PostgreSQL via Prisma.

- Auth models: `User`, `Account`, `Session`, `VerificationToken`
- Business model: `Client`

Relevant file:
- `prisma/schema.prisma`

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Radix UI Themes
- Lucide React
- NextAuth v5 beta
- Prisma + PostgreSQL
- WebDAV
- Docker / Docker Compose

## Project Structure

```text
.
├── config/                 # App settings persisted locally
├── data/                   # Local JSON document storage fallback
├── prisma/                 # Prisma schema and auth/client models
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   ├── actions.ts      # Server actions for settings, docs, quote requests
│   │   ├── api/auth/       # NextAuth route handler
│   │   ├── admin/          # Admin dashboard and document workflows
│   │   ├── auth/           # Sign-in, verify, and error pages
│   │   ├── dashboard/      # Signed-in dashboard
│   │   ├── estimates/      # Non-admin estimate routes
│   │   ├── import/         # Non-admin import flow
│   │   ├── invoices/       # Non-admin invoice routes
│   │   ├── receipts/       # Non-admin receipt routes
│   │   ├── settings/       # Non-admin settings
│   │   └── components/     # App-scoped UI like the quote form
│   ├── components/         # Shared UI components
│   └── lib/                # Auth, data, config, WebDAV, Prisma helpers
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Environment Variables

See `.env.example` for the current template.

### Required core values
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_PORT`

### Email auth values
- `EMAIL_SERVER`
- `EMAIL_FROM`

### Port note
If you change `APP_PORT`, update `NEXTAUTH_URL` to the same host/port so sign-in redirects stay correct.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Then update values for:
- PostgreSQL connection
- NextAuth secret
- SMTP settings if using magic links
- app/auth port alignment

### 3. Start PostgreSQL

You can use your own Postgres instance or the bundled Docker service:

```bash
docker compose up -d postgres
```

The included Compose config exposes Postgres on host port `5433`.

### 4. Apply Prisma migrations

```bash
npm run prisma:migrate:dev
```

### 5. Start the app

```bash
npm run dev
```

By default, Next.js dev mode runs on `http://localhost:3000` unless you explicitly start it on another port. If you are running the app on a custom port, make sure `NEXTAUTH_URL` matches it.

### 6. Configure storage

If you want WebDAV-backed document storage:

1. Sign in.
2. Open `/settings` or `/admin/settings`.
3. Enter WebDAV credentials and save.

If WebDAV is not configured, the app falls back to local JSON storage in `data/`.

## Docker Deployment

The repository includes a production-oriented `Dockerfile` and `docker-compose.yml`.

### Start the full stack

```bash
docker compose up -d --build
```

### Default ports
- App host port: `3081` by default through Compose
- Internal app port: `3000`
- Postgres host port: `5433`

### Compose behavior
- `web` builds from the local `Dockerfile`
- `postgres` runs from `postgres:16-alpine`
- app data persists via Docker volumes
- auth and DB environment variables are passed through Compose

## Scripts

- `npm run dev` - start Next.js in development
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate:dev` - apply local Prisma migrations
- `npm run prisma:migrate:deploy` - apply deployment migrations
- `npm run prisma:studio` - open Prisma Studio

## Document Workflow Notes

### Invoices
- Can be created, edited, previewed, printed, and saved as draft, sent, or paid.

### Estimates
- Support detailed project notes and detailed line-item descriptions.
- Can be saved as draft or finalized/sent.

### Receipts
- Support create, edit, preview, printing, and import-oriented workflows.

### Leads
- Created from the public quote request form.
- Surfaced in the admin dashboard and stored as documents.

## Important Files

- `src/app/page.tsx` - public website
- `src/app/actions.ts` - server actions
- `src/app/admin/page.tsx` - admin dashboard
- `src/app/dashboard/page.tsx` - signed-in dashboard
- `src/components/NewInvoiceForm.tsx` - shared document form
- `src/components/DocumentPreview.tsx` - document preview and print UI
- `src/lib/auth.ts` - auth config
- `src/lib/data.ts` - document loading/saving
- `src/lib/config.ts` - settings persistence
- `src/lib/webdav.ts` - WebDAV integration
- `src/lib/types.ts` - shared document types
- `prisma/schema.prisma` - database schema

## Known Operational Notes

- Local JSON storage is the fallback when WebDAV is not configured.
- WebDAV configuration is stored locally in `config/settings.json`.
- Document previews are optimized for both on-screen review and printing.
- There are overlapping admin and non-admin document routes; if you simplify routing later, update this README.

## License

Private repository for Marotto Solutions.
