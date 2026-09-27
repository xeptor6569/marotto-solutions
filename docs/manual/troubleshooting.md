# Troubleshooting

## Start at the System page

**Tools → System** shows live diagnostics with fix hints: database connectivity, active document storage, email configuration, Stripe mode, cron secret, and URLs. Most "why isn't X working" questions are answered there.

## Common issues

- **Sign-in redirects fail or loop:** `NEXTAUTH_URL` must exactly match the address you open the app on (scheme, host, and port).
- **No sign-in code / emails not arriving:** `EMAIL_SERVER` is missing or wrong, or mail is going to a test sink — the System page's Email card shows which.
- **Clients / jobs / calendar missing:** those features need `DATABASE_URL`. Documents still work without it, but numbering falls back to filesystem scanning.
- **Card payments not recorded on invoices:** the Stripe webhook is not configured — set `STRIPE_WEBHOOK_SECRET` and point a Stripe webhook at `/api/stripe/webhook`.
- **Contract invoices not generating / reminders not sending:** the cron endpoints are not being called or `CRON_SECRET` is missing. See [Scheduled jobs](../deployment.md#scheduled-jobs).

## For integrations

The **API reference** (linked from the System page) documents every endpoint — health checks for uptime monitoring, cron endpoints, Stripe, and backups — with example commands.

Installation and server problems (containers not starting, database errors, HTTPS) are covered in the [self-hosting troubleshooting guide](../troubleshooting.md).
