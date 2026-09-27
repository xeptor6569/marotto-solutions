# Troubleshooting

Start with **Tools → System** in the app. It checks the database, document storage, email, Stripe, cron, and URLs, and shows a fix hint next to anything that's wrong. If you can't sign in, use the command-line checks below.

## Installation

**The app container keeps restarting, or `/setup` says the database is unavailable**

The app applies database migrations every time it starts and refuses to start if that fails. The reason is in the log:

```bash
docker compose logs --tail 50 web
```

- **"Can't reach database server"**: check `docker compose ps`; `postgres` should be `healthy`. If you set `DATABASE_URL` in `.env` to a `localhost` address, remove it. Inside containers the database is reached at `postgres:5432`, which is the default.
- **"Authentication failed"**: see the next item.

**"Authentication failed" after changing `POSTGRES_PASSWORD`**

Postgres only reads the password when its volume is first created. Either put the old password back, or change it inside the database to match:

```bash
docker compose exec postgres psql -U marotto -d marotto_db -c "ALTER USER marotto PASSWORD 'new-password';"
```

On a fresh install with no data yet, `docker compose down -v` deletes the volumes so you can start over. **This erases everything.**

**The build is killed or the server freezes during `docker compose up --build`**

The server ran out of memory. The build needs about 2 GB. Add swap (e.g. a 2 GB swapfile) and retry.

**Port already in use**

Another service is using 3081 or 5433. Set `APP_PORT` and/or `POSTGRES_PORT` in `.env` to free ports. If you change `APP_PORT`, update `NEXTAUTH_URL` to match.

## Signing in

**Sign-in redirects to the wrong address, loops, or shows a configuration error**

`NEXTAUTH_URL` must exactly match what's in the browser's address bar: scheme (`https`), host, and port if non-standard. No trailing slash. After changing it, run `docker compose up -d`.

**No sign-in code arrives**

Email isn't working; see [Email](#email) below. Password sign-in doesn't need email, so sign in with your password instead.

**Forgot the admin password / locked out**

Run this with your account email and a new password:

```bash
docker compose exec -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='new-password' web node scripts/seed-admin.js
```

**Everyone got signed out**

`NEXTAUTH_SECRET` changed. Keep it stable across restarts and upgrades.

## Email

- Check **Tools → System → Email** for the SMTP target the app is using.
- Watch `docker compose logs -f web` while sending, for the SMTP error message.
- Special characters in the SMTP password must be URL-encoded (`@` → `%40`, `:` → `%3A`, `/` → `%2F`).
- Port 587 uses `smtp://` (STARTTLS); port 465 uses `smtps://`.
- Many VPS providers block outbound port 25, and some block 587/465 until you ask. Use your provider's allowed port or an HTTP-relay SMTP service.
- If mail arrives in spam, add SPF and DKIM records for the domain in `EMAIL_FROM`.

## Payments

**Card payments don't show up on invoices**

The Stripe webhook isn't reaching the app. In the Stripe dashboard, check the webhook endpoint `https://your-domain/api/stripe/webhook`:

- It must subscribe to `checkout.session.completed`.
- Its signing secret must match `STRIPE_WEBHOOK_SECRET`.
- It must be the same mode (test or live) as `STRIPE_SECRET_KEY`.

Stripe shows each delivery attempt and the response. You can resend failed events from there once fixed.

**"Pay with card" doesn't appear**

The button only appears on an **invoice's share link**, not in the admin preview or on other document types. If it's missing there, `STRIPE_SECRET_KEY` isn't set, Stripe isn't enabled under **Settings → Billing** (or the invoice overrides payment methods without it), or you're on a non-production instance (`APP_ENV=dev`) with a live key, which is refused on purpose.

**I recorded a payment by mistake**

Open the invoice, find the payment in the **Payments** panel, and use its trash icon. The linked receipt is removed and the balance goes back up. Stripe payments must be refunded in Stripe.

## Scheduled jobs

**Recurring contract invoices aren't generated / reminders aren't sent**

- `CRON_SECRET` must be set; without it the endpoints refuse all calls.
- `docker compose ps` should show the `cron` container running.
- Check its log: `docker compose exec cron tail -n 50 /var/log/contracts-cron.log`
- Schedules are in **UTC**.

## Data and storage

**Documents disappeared after connecting WebDAV**

With WebDAV configured, the app reads documents from that server, not the local volume. Existing local documents aren't moved. Clear the WebDAV fields under **Settings → Storage** to see local documents again. To move documents, back up, switch storage, then restore.

**Restore fails with an upload error**

- Restore takes the `.tar.gz` downloaded from **Tools → Backup & Restore**. **Tools → Import** takes JSON document lists; they're different features.
- Behind nginx, raise `client_max_body_size` (see [Deploying](deployment.md#option-b-nginx)). Cloudflare's free plan caps uploads at 100 MB.

**Document numbers jumped or don't start where I want**

Numbers only move forward. Set a higher starting number under **Settings → Documents**. It applies to the next document created.

## Mobile

**The installed app shows an old logo or name**

Home-screen icons are cached by the phone. Remove the app from the home screen and add it again.

**The page zooms when I tap a field on iPhone**

That shouldn't happen in current versions. Make sure you've upgraded, then remove and re-add the home-screen app.

## Getting more detail

```bash
docker compose ps
docker compose logs --tail 200 web
curl -s https://your-domain/api/health
```

When asking for help, include the output of the above (remove anything secret), your install method, and what you expected to happen.
