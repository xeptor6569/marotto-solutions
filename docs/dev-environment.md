# Dev Environment (`dev.marottosolutions.com`)

A second, fully isolated instance of the app that runs beside production on the
same host. Own database, own document volume, own secrets. Safe to point a
refactor branch at.

## What makes it isolated

Isolation is entirely env-driven; there is no separate application code path.

| Concern | Prod | Dev |
|---|---|---|
| Compose project | default | `marotto-dev` (prefixes the volumes) |
| Containers | `marotto-solutions`, `marotto-postgres`, `marotto-cron` | `marotto-dev-*` |
| App host port | `3081` | `3082` |
| Postgres host port | `5433` | `5434` |
| Outbound email | real SMTP | mailpit sink, nothing leaves the host |
| Stripe | live key | test key only, enforced in code |
| Scheduler | runs | behind the `cron` profile, off by default |
| `robots.txt` | normal rules | `Disallow: /` |

`docker-compose.yml` reads `STACK_NAME`, `APP_PORT`, `POSTGRES_PORT` and
`APP_ENV`, all of which default to today's production values. Running compose
without a dev `.env` therefore behaves exactly as it always has.

## Ports

| Service | Bind | Purpose |
|---|---|---|
| app | `3082` | proxied to `dev.marottosolutions.com` |
| postgres | `5434` | dev database |
| mailpit UI | `127.0.0.1:8025` | captured outbound email |
| adminer | `127.0.0.1:8083` | database browser |
| prisma studio | `127.0.0.1:5555` | record editor (`tools` profile) |

The debug UIs bind to loopback only. Reach them over an SSH tunnel:

```bash
ssh -L 8025:127.0.0.1:8025 -L 8083:127.0.0.1:8083 your-host
```

## Bring it up by hand

```bash
cp env.dev.example .env      # then edit the secrets
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Apply migrations from the host, against the dev port:

```bash
DATABASE_URL="postgresql://marotto:marotto_password@127.0.0.1:5434/marotto_db" \
  npx prisma migrate deploy
```

Create an admin user:

```bash
DATABASE_URL="postgresql://marotto:marotto_password@127.0.0.1:5434/marotto_db" \
  node scripts/seed-admin.js
```

Always pass both `-f` files. Running `docker compose up` with only the base file
while a dev `.env` is present starts a dev-named stack with production settings.

### Optional services

```bash
# Prisma Studio
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --profile tools up -d prisma-studio

# Exercise the contract/calendar schedulers
docker compose -f docker-compose.yml -f docker-compose.dev.yml \
  --profile cron up -d cron
```

## Deploying a branch to dev

Pushing to `develop` deploys automatically. To deploy any other branch, run the
**Deploy to Dev** workflow manually and set the `ref` input to the branch, tag
or SHA. Confirm what landed:

```bash
curl -s https://dev.marottosolutions.com/api/health
```

`commit` in that response is the SHA the image was built from.

Dev and prod deploys share the `self-hosted-deploy` concurrency group, so they
queue rather than build over each other on the single runner.

Dev migrations fall back to `prisma db push --accept-data-loss` when
`migrate deploy` fails, on the assumption that dev data is disposable. Prod has
no such fallback.

## Debugging tools

### Captured email (mailpit)

Every message the app sends — magic-link sign-in codes, invoice emails, quote
confirmations, calendar reminders — is captured at `127.0.0.1:8025` instead of
being delivered. This is the main safety property of the dev instance: even
with restored production data, no client can be contacted.

Sign-in works normally; read the code out of mailpit.

### `/api/health`

Anonymous callers get liveness only:

```json
{ "ok": true, "env": "dev", "commit": "…", "time": "…" }
```

Signed in as an admin, the same URL reports runtime state that is otherwise
invisible from the UI: database reachability, which document store is active
(WebDAV vs local JSON), which numbering strategy that implies, the Stripe mode,
and where SMTP is actually pointed. Useful when dev behaves differently from
prod and the cause is configuration rather than code.

### Source maps

Non-production builds set `productionBrowserSourceMaps`, so client stack traces
on dev point at real source instead of minified bundles. Prod stays without
published maps.

### DEV banner

Non-production instances render a `DEV` badge in the bottom-left corner. Dev and
prod are otherwise visually identical, and the badge is what stops you from
editing a real invoice while believing you are on dev.

## Seeding dev with real-shaped data

The admin backup/restore flow handles both halves of the hybrid persistence
split in one archive:

1. On prod, sign in and download an archive from `/admin/backup`.
2. On dev, restore it from the same page.

That copies the Prisma records and the JSON document store together. Restoring
also wipes whatever was in dev first. Mail is captured either way, so restored
customer records cannot be contacted.

## Guardrails

- The deploy workflow fails if the dev `NEXTAUTH_SECRET` is missing, or if
  `STRIPE_SECRET_KEY` is a live key.
- `getStripe()` throws on a live key whenever `APP_ENV` is not production, and
  `isStripeConfigured()` reports false so the UI offers other payment methods
  instead of a Checkout button that always errors.
- `robots.txt` is generated per request, so the noindex reflects the running
  container rather than whatever was true at build time.
- Put Cloudflare Access in front of `dev.marottosolutions.com`. Nothing in the
  app itself makes the marketing pages private.

## Setting up the subdomain

1. Cloudflare DNS: `dev` → the same origin as prod, proxied.
2. Route `dev.marottosolutions.com` to host port `3082`, the same way prod
   reaches `3081`.
3. Add a Cloudflare Access policy over the whole hostname.
4. In GitHub, create a `dev` environment with variable `NEXTAUTH_URL` =
   `https://dev.marottosolutions.com` and its own `NEXTAUTH_SECRET`,
   `EMAIL_FROM`, and Stripe test secrets.

Dev cookies are host-only, so a dev session will not collide with prod.
