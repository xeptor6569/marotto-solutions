# Deploying to production

This guide assumes you've completed [Getting started](getting-started.md) at least once and now want the app reachable at your own domain over HTTPS, so clients can open share links and pay invoices.

## Checklist

- [ ] A server with Docker (a 2 GB RAM VPS is plenty for one business)
- [ ] A domain or subdomain pointing at it, e.g. `office.example.com`
- [ ] HTTPS in front of the app (a reverse proxy or tunnel, below)
- [ ] `NEXTAUTH_URL=https://office.example.com` in `.env`
- [ ] Strong `NEXTAUTH_SECRET`, `CRON_SECRET`, and `POSTGRES_PASSWORD`
- [ ] Working SMTP (`EMAIL_SERVER`, `EMAIL_FROM`) with SPF/DKIM set up for your sending domain
- [ ] Firewall: only ports 80/443 (and SSH) open to the internet
- [ ] Stripe keys and webhook, if you take card payments
- [ ] A backup routine ([Backups & upgrades](operations.md))

## Choosing a server

Any Linux VPS or home server that can run Docker works: Hetzner, DigitalOcean, Linode, a Synology NAS, a spare mini PC. Building the image needs roughly 2 GB of memory. If your server has 1 GB, add swap before the first build.

Install Docker using the [official instructions](https://docs.docker.com/engine/install/) for your distribution, then follow steps 1–3 of [Getting started](getting-started.md) on the server.

## HTTPS and your domain

The app listens on plain HTTP on `APP_PORT` (default `3081`). Put something in front of it that terminates TLS. Pick one of the options below.

Whichever you choose:

- Set `NEXTAUTH_URL` to the public `https://` address with **no trailing slash and no port**, then run `docker compose up -d` to apply.
- Serve the app at the **root of a domain or subdomain**. Sub-paths like `example.com/office` are not supported.
- The public website (if enabled) and the back-office share the same address: `/` is the site, `/admin` is the back-office.

### Option A: Caddy (simplest, automatic certificates)

Install [Caddy](https://caddyserver.com/docs/install) on the host and use this `Caddyfile`:

```
office.example.com {
    reverse_proxy 127.0.0.1:3081
}
```

Caddy obtains and renews the certificate automatically. Upload size limits are not an issue with Caddy's defaults.

### Option B: nginx

```nginx
server {
    listen 443 ssl http2;
    server_name office.example.com;

    ssl_certificate     /etc/letsencrypt/live/office.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/office.example.com/privkey.pem;

    # Backup restores and job attachments are uploaded through the app.
    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:3081;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Get certificates with [Certbot](https://certbot.eff.org/) (`certbot --nginx -d office.example.com`).

### Option C: Cloudflare Tunnel (no open ports)

Good for home servers or when you can't open ports 80/443. Install `cloudflared`, create a tunnel in the Cloudflare Zero Trust dashboard, and add a public hostname `office.example.com` → `http://localhost:3081`. Cloudflare handles HTTPS.

On Cloudflare's free plan, uploads are limited to 100 MB per request. That matters only for restoring very large backups.

## Lock down the ports

Docker publishes `APP_PORT` (3081) and `POSTGRES_PORT` (5433) on **all interfaces**, and Docker's port rules bypass `ufw`. Once a reverse proxy is in place:

- Block 3081 and 5433 at your cloud provider's firewall / security group, **or**
- Bind them to localhost by editing the `ports:` lines in `docker-compose.yml`, e.g. `"127.0.0.1:${APP_PORT:-3081}:3000"` and `"127.0.0.1:${POSTGRES_PORT:-5433}:5432"`.

## Email

Outgoing email powers sign-in codes, sending documents to clients, quote-request notifications, and calendar reminders.

1. Get SMTP credentials from your provider.
2. Set `EMAIL_SERVER` (e.g. `smtp://apikey:SECRET@smtp.provider.com:587`) and `EMAIL_FROM` (an address on your own domain).
3. In your DNS, add the **SPF** and **DKIM** records your provider gives you, so mail doesn't land in spam.
4. Run `docker compose up -d`, then check **Tools → System → Email**. Send yourself an invoice to confirm.

Characters like `@`, `:`, or `/` in the SMTP password must be URL-encoded (`@` → `%40`).

## Card payments with Stripe

With Stripe connected, shared invoices get a **Pay with card** button. Clients can pay the full balance, a custom amount, a percentage, or an equal split. Payments are recorded on the invoice automatically, with a receipt.

1. In the [Stripe dashboard](https://dashboard.stripe.com/), start in **test mode**.
2. Copy the secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
3. Under **Developers → Webhooks**, add an endpoint:
   - URL: `https://office.example.com/api/stripe/webhook`
   - Event: `checkout.session.completed`
4. Copy the endpoint's signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.
5. Run `docker compose up -d`. Enable **Stripe** under **Settings → Billing**.
6. Open an invoice's share link, pay with Stripe's test card `4242 4242 4242 4242`, and confirm the payment appears in the invoice's **Payments** panel.
7. Repeat steps 2–4 with live-mode keys and a live-mode webhook when you're ready.

Charges use the currency from **Settings → Business**. Refunds are issued from the Stripe dashboard.

## Scheduled jobs

The `cron` container runs automatically and needs only `CRON_SECRET`:

- **Contracts** (daily at 08:15 UTC by default): generates, and optionally emails, invoices for recurring contracts that are due
- **Calendar** (hourly): sends reminder emails for upcoming events

Change the times with `CONTRACTS_CRON_SCHEDULE` / `CALENDAR_CRON_SCHEDULE` (standard cron syntax, UTC). To drive them from an external scheduler instead, remove the `cron` service and call:

```bash
curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" https://office.example.com/api/cron/contracts
curl -fsS -X POST -H "X-Cron-Secret: $CRON_SECRET" https://office.example.com/api/cron/calendar
```

## Monitoring

`GET /api/health` returns `{"ok": true, ...}` with HTTP 200 when the app is up. Point an uptime monitor (Uptime Kuma, UptimeRobot, Better Stack) at `https://office.example.com/api/health`.

Signed-in admins see the full diagnostics, including database, storage, email, Stripe, and cron, on **Tools → System**. **Tools → System → API reference** documents every endpoint.

## Using an external database

To use managed Postgres (RDS, Neon, Supabase, etc.), set `DATABASE_URL` in `.env` to its connection string. The app uses it and applies migrations to it on startup. The bundled `postgres` container still starts, but nothing connects to it.

## Running a second instance

You can run a staging copy on the same server, for example to try an upgrade against a copy of your data first. Give it its own directory, `.env`, `COMPOSE_PROJECT_NAME`, `STACK_NAME`, `APP_PORT`, and `POSTGRES_PORT`, and set `APP_ENV=dev`. Non-production instances show a banner, are hidden from search engines, and refuse live Stripe keys.

The repository's own staging setup, which adds a mail sink so a staging copy never emails real clients, is described in [dev-environment.md](dev-environment.md).

## Automated deploys (optional)

`.github/workflows/deploy.yml` deploys `main` to a server running a [self-hosted GitHub Actions runner](https://docs.github.com/en/actions/hosting-your-own-runners). It writes `.env` from repository secrets, applies migrations, and rebuilds the stack. If you fork the repo and want push-to-deploy, register a runner on your server and configure what that workflow reads:

- repository **secrets**: `NEXTAUTH_SECRET`, `APP_PORT`, `EMAIL_SERVER`, `EMAIL_FROM`, and optionally `DATABASE_URL` and `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD`
- repository **variable**: `NEXTAUTH_URL`

The workflow rewrites `.env` on every run. If you use `CRON_SECRET`, `STRIPE_*`, or other settings, add matching lines to its "Create .env file" step. Otherwise, the manual upgrade steps in [Backups & upgrades](operations.md#upgrading) are all you need.
