# Getting started

This guide takes you from nothing to a running back-office on your own machine or server in about fifteen minutes. When you're ready to put it on the internet with your own domain, continue with [Deploying to production](deployment.md).

## What you get

One Docker Compose stack with three long-running containers:

| Container | What it does |
|---|---|
| `web` | The app itself: admin back-office at `/admin`, optional public website at `/`, client share links |
| `postgres` | Database for accounts, clients, jobs, contracts, calendar, and document numbering |
| `cron` | Tiny scheduler that triggers recurring-contract invoicing (daily) and calendar reminders (hourly) |

Your documents (invoices, estimates, quotes, receipts), settings, logo, and attachments live in a Docker volume mounted at `/app/data`, or on a WebDAV/Nextcloud server if you choose to connect one later.

## Requirements

- A Linux server, Mac, or Windows machine with **Docker** and the **Docker Compose plugin** (`docker compose version` should work). Docker Desktop includes both.
- About **2 GB of RAM** free while building the image (the running app needs far less) and ~2 GB of disk.
- **Git**, to download and later update the code.
- Optional but recommended: an **SMTP account** for outgoing email (sign-in codes, sending invoices, reminders). Any provider works: your email host, Postmark, Mailgun, Amazon SES, Fastmail, Gmail with an app password, and so on.

You do **not** need Node.js installed on the host.

## 1. Download the code

```bash
git clone <repository-url> backoffice
cd backoffice
```

## 2. Create your `.env`

```bash
cp env.example .env
```

Open `.env` in an editor and set at least these values:

```bash
# A long random secret for signing sessions:
#   openssl rand -base64 32
NEXTAUTH_SECRET=paste-the-generated-value

# The exact address you'll open the app on. For a first local try:
NEXTAUTH_URL=http://localhost:3081
APP_PORT=3081

# Outgoing mail. If you don't have SMTP yet, leave the placeholder;
# password sign-in still works, you just can't send email.
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=office@yourbusiness.com

# Protects the scheduler endpoints:
#   openssl rand -hex 24
CRON_SECRET=paste-another-generated-value

# Database password. Set it now: Postgres only reads it the first time the
# database volume is created. Use letters and digits only:
#   openssl rand -hex 24
POSTGRES_PASSWORD=paste-a-third-generated-value
```

Leave `DATABASE_URL` commented out. The containers connect to the bundled database automatically.

Every variable is explained in [Configuration](configuration.md#environment-variables).

## 3. Start the stack

```bash
docker compose up -d --build
```

The first build takes several minutes. On startup the app creates its database tables automatically (and applies any changes after future upgrades), so there's no separate database step. Check progress with:

```bash
docker compose ps          # web should become "healthy"
docker compose logs -f web # Ctrl+C to stop following
```

## 4. Run the first-time setup wizard

Open **http://localhost:3081/admin** (your `NEXTAUTH_URL` followed by `/admin`). With no accounts yet, you're sent to the **setup wizard** at `/setup`, which asks for:

1. **Your admin account**: name, email, and password
2. **Your business**: name, phone, email, currency, and timezone (detected from your browser)
3. **A theme**: pick one of the presets (changeable any time)

Submitting signs you straight into the back-office. The wizard disables itself once an account exists.

> Prefer scripting? Instead of the wizard, run
> `docker compose exec -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='new-password' web node scripts/seed-admin.js`.
> See [Configuration](configuration.md#first-admin-account).

## 5. Make it yours

Everything brand-specific is set in **Settings** (`/admin/settings`). A good first pass:

| Tab | Do this first |
|---|---|
| **Business** | Legal name, address, service area, number format; check currency and timezone |
| **Appearance** | Upload your logo, fine-tune the theme, set letterhead text and the document accent color |
| **Billing** | Turn on the payment methods you accept (Zelle, check, Stripe…), add handles/links and payment instructions |
| **Documents** | Choose number prefixes and starting numbers (e.g. continue from your old system's invoice #1042) |
| **Public Site** | Turn the marketing homepage on or off; add services, selling points, testimonials |
| **Account** | Change your password |
| **Storage** | Leave empty to keep documents on the server, or connect Nextcloud/WebDAV |

Then try a full loop: create a client, write an estimate, convert it to an invoice, open the invoice's share link in a private window, and record a payment from the invoice's **Payments** panel. A receipt is generated automatically.

## 6. Install it on your phone

The back-office is an installable web app with a phone-friendly layout:

- **iPhone / iPad:** open the site in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open it in Chrome, tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

The home-screen icon and name come from your logo and business name.

## Where to find help

- **User manual:** start with [Your first job, start to finish](manual/first-job.md) for the everyday workflow; the [full manual](README.md#user-manual) covers every feature. It's also built into the app under **Tools → Help**, and the **?** icons next to labels explain individual fields.
- **In the app:** **Tools → System** shows live diagnostics with fix hints.
- **These docs:** [Configuration](configuration.md) · [Deploying to production](deployment.md) · [Backups & upgrades](operations.md) · [Troubleshooting](troubleshooting.md)

## Next step

Running on `localhost` is fine for trying things out. To send share links to clients and take card payments you need a public HTTPS address; see [Deploying to production](deployment.md).
