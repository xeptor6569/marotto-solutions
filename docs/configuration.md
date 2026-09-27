# Configuration

There are two layers of configuration:

1. **Server settings** in `.env`: secrets, URLs, email, payments. These are read when the containers start. Change them, then run `docker compose up -d` to apply.
2. **Business settings** in the app under **Settings** (`/admin/settings`): your brand, content, payment methods, numbering, and storage. These are saved to `data/config/settings.json` and take effect immediately.

## Environment variables

`env.example` is the annotated template; copy it to `.env`. Values marked **compose default** are filled in by `docker-compose.yml` when unset.

### Core

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | **yes** | Signs sessions. Generate with `openssl rand -base64 32`. Changing it signs everyone out. |
| `NEXTAUTH_URL` | **yes** | The exact public address of the app, including scheme and port if non-standard: `https://office.example.com` or `http://localhost:3081`. Sign-in redirects break if this doesn't match what's in the browser's address bar. |
| `APP_PORT` | compose default `3081` | Host port the app is published on. The container always listens on 3000. |
| `DATABASE_URL` | compose default | **Leave unset** with the bundled database. Set it only to use an external/managed Postgres, or when running `npm run dev` on the host (`postgresql://marotto:<password>@localhost:5433/marotto_db`). |
| `POSTGRES_PASSWORD` | compose default `marotto_password` | Password for the bundled database. Set it **before the first start**; Postgres only reads it when its volume is created. Use URL-safe characters. |
| `POSTGRES_PORT` | compose default `5433` | Host port the bundled Postgres is published on (for host-side tools and backups). |

### Email

| Variable | Required | Description |
|---|---|---|
| `EMAIL_SERVER` | recommended | SMTP connection string, e.g. `smtp://user:pass@smtp.example.com:587` or `smtps://user:pass@smtp.example.com:465`. URL-encode special characters in the password (`@` → `%40`). Used for sign-in codes, sending documents, quote-request notifications, and reminders. |
| `EMAIL_FROM` | optional | Sender address. Falls back to the business email in Settings → Business. Your SMTP provider must allow sending as this address. |
| `ADMIN_NOTIFICATION_EMAIL` | optional | Where public quote-request notifications go (default: `EMAIL_FROM`). |
| `OPERATOR_EMAIL` | optional | Where calendar reminder emails go (default: `EMAIL_FROM`). |

Without working SMTP the app still runs and password sign-in works; email features fail with an error you'll see in **Tools → System**.

### Scheduler

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | recommended | Shared secret the `cron` container sends as the `X-Cron-Secret` header. Generate with `openssl rand -hex 24`. Without it the scheduler endpoints refuse all calls. |
| `CONTRACTS_CRON_SCHEDULE` | optional | Cron expression (UTC) for recurring-contract invoicing. Default `15 8 * * *` (daily 08:15). |
| `CALENDAR_CRON_SCHEDULE` | optional | Cron expression for calendar reminders. Default `0 * * * *` (hourly). |

### Card payments (Stripe)

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | optional | Enables **Pay with card** on shared invoices via Stripe Checkout. `sk_test_…` for testing, `sk_live_…` for real payments. |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Signing secret (`whsec_…`) for the webhook that records payments. See [Deploying → Stripe](deployment.md#card-payments-with-stripe). |

### Instance identity

| Variable | Required | Description |
|---|---|---|
| `APP_ENV` | optional | `production` (default), `dev`, or `local`. Non-production instances show a banner, tell search engines not to index, and refuse live Stripe keys. |
| `STACK_NAME` | optional | Prefix for container names (default `marotto`), so two stacks can share a host. |
| `DOCS_HOST` | optional | Hostname that serves these guides as a website at its root. By default any hostname starting with `docs.` does. See [Deploying → Documentation site](deployment.md#documentation-site-optional). |
| `NEXT_PUBLIC_SITE_URL` | optional | Public website URL when it differs from `NEXTAUTH_URL` (used in SEO metadata and sitemaps). |
| `APP_COMMIT_SHA` | optional | Build identifier shown by `/api/health`. Set automatically by the deploy workflows. |
| `SKIP_MIGRATIONS` | optional | Set to `1` to stop the app container from applying database migrations on startup (for setups that migrate separately). |

### First admin account

| Variable | Description |
|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Read by `scripts/seed-admin.js`, which creates the admin account, or resets its password if the email already exists. Pass them on the command line rather than storing them in `.env`. |

The setup wizard at `/setup` is the easiest way to create the first account. The script is for automation and for **password resets** when you're locked out:

```bash
docker compose exec -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='new-password' web node scripts/seed-admin.js
```

## In-app settings

Open **Settings** from the sidebar (or the bottom bar's **More** menu on a phone).

### Business

Business name, legal name, tagline, phone, email, address, and service area. These appear on documents, emails, the public site, and the installed app's name.

- **Currency** controls the money symbol and rounding everywhere, including Stripe charges.
- **Number format locale** controls separators (`1,234.50` vs `1.234,50`).
- **Timezone** is used for due dates, the calendar, and reminder timing, regardless of the server's own timezone.

### Appearance

- **Theme preset**, or custom accent color, gray tone, and corner radius
- **Default appearance** for visitors (light, dark, or follow the device). Each visitor can still switch with the sun/moon toggle, and their choice is remembered.
- **Logo** upload (PNG, JPG, WebP, SVG, or GIF, up to 2 MB), used in the header, documents, and app icon
- **Letterhead** lines and **document accent color** for printed/PDF documents. Documents always print on a light background.

### Public Site

Switch the marketing homepage on or off. When off, visitors to `/` see a minimal sign-in card.

When on, configure the hero text, SEO title/description, selling points, testimonials, and the **service catalog**. Each service gets its own page and appears as an option on the quote-request form; submitted requests become prospect clients in the back-office.

### Billing

The payment methods shown on invoices (cash, check, Zelle, Cash App, PayPal, Venmo, Apple Pay, Stripe): enable, rename, reorder, and add handles/links and instructions. Individual invoices can override the list.

### Documents

- **Editor style:** guided (step by step, good on phones) or full page
- **Numbering** per document type: prefix, starting number, and digit width. Example: prefix `INV`, start `1042`, width `5` → `INV-01042`. Numbers never go backwards; the starting number only applies when it's higher than what's already been issued.

### Account

Set or change the password for the signed-in account.

### Storage

Where documents are stored:

- **Local (default):** leave the WebDAV fields empty. Documents live in the `data` Docker volume and are included in backups.
- **WebDAV / Nextcloud:** enter the WebDAV URL, username, an app password, and a folder name. Documents are then read from and written to that server. Changing the folder does not move existing files.

## What lives where

| Data | Stored in |
|---|---|
| Accounts, clients, jobs, helpers, contracts, calendar, document counters | Postgres (`postgres_data` volume) |
| Invoices, estimates, quotes, receipts, leads | JSON files in the `data` volume, or on WebDAV |
| Settings, logo, job attachments | `data` volume |

**Tools → Backup & Restore** captures all of it in one archive; see [Backups & upgrades](operations.md).
