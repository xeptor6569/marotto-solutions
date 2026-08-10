# Domain Migration: `marotto.me` → `marottosolutions.com`

Runbook for making `marottosolutions.com` the primary domain and demoting
`marotto.me` to a permanent redirect.

## What the app reads

Almost nothing about the domain is hardcoded. One variable drives it all:

| Consumer | Source | Notes |
|---|---|---|
| `metadataBase`, canonicals, Open Graph | `getSiteUrl()` in `src/lib/marketing.ts` | `NEXT_PUBLIC_SITE_URL` \|\| `NEXTAUTH_URL` |
| `sitemap.xml`, JSON-LD, `robots.txt` host | `getSiteUrl()` | same |
| Invoice / quote / reminder email links | `getPublicSiteUrl()` in `src/lib/email.ts` | `NEXTAUTH_URL` |
| Stripe Checkout success + cancel URLs | `getAppBaseUrl()` in `src/lib/stripe.ts` | `NEXTAUTH_URL` \|\| `AUTH_URL` |
| Auth callbacks and cookies | `NEXTAUTH_URL` / `AUTH_URL` | written by the deploy workflow |

`NEXT_PUBLIC_SITE_URL` is not set by the deploy, so **`NEXTAUTH_URL` is the
single source of truth**. Changing that one GitHub variable moves every URL
above.

### A redeploy is required, not just a variable change

`sitemap.xml` and the four `/services/[slug]` pages are generated at build time,
and `metadataBase` is evaluated when the module loads. Editing the GitHub
variable does nothing until the image is rebuilt. `.env` is inside the Docker
build context, which is how the build picks the value up.

So: change the variable, then push to `main` (or re-run the deploy workflow).

## Order of operations

Serve the new domain **before** redirecting the old one. Reversing these leaves
a redirect loop.

### 1. DNS and TLS

- Point `marottosolutions.com` (and `www`, if used) at the same origin as prod.
- In Nginx Proxy Manager, add a proxy host for `marottosolutions.com` → host
  port `3081`, and issue a certificate covering it. A `marotto.me` certificate
  does not cover it; hostname matching is exact.
- Keep `marotto.me` serving normally for now.

### 2. Email sender

Decide the sender domain before switching, and authenticate it (SPF, DKIM,
DMARC) with the SMTP provider. The current fallback in
`src/lib/email-identity.ts` is `noreply@marotto-solutions.com` — a third,
hyphenated domain that matches neither site. Production always sets the
`EMAIL_FROM` secret, so the fallback is inert there, but it is the value to
change if you want the code default to match the new brand.

### 3. Flip the app to the new domain

In the GitHub **prod** environment:

- Variable `NEXTAUTH_URL` → `https://marottosolutions.com`
- Secret `EMAIL_FROM` → the new sender, if it is changing

Then deploy. Verify before touching `marotto.me`:

```bash
curl -s https://marottosolutions.com/api/health
curl -s https://marottosolutions.com/robots.txt      # Host + Sitemap on new domain
curl -s https://marottosolutions.com/sitemap.xml     # all <loc> on new domain
```

Sign in and email yourself a document; the share link must point at
`marottosolutions.com`.

### 4. Update the Stripe webhook

In the Stripe dashboard, change the endpoint to
`https://marottosolutions.com/api/stripe/webhook`.

This is easy to miss and it fails silently from the operator's side. Stripe
treats a `3xx` as a delivery failure rather than following it, so once
`marotto.me` becomes a redirect the old endpoint stops working and paid
invoices stop being marked paid. The signing secret does not change unless you
create a new endpoint rather than editing the existing one — if you do create a
new one, update `STRIPE_WEBHOOK_SECRET` too.

### 5. Redirect the old domain

Change `marotto.me` from serving the app to a **301, path-preserving** redirect:

```
https://marotto.me/*  →  https://marottosolutions.com/$1
```

Path preservation matters because existing customer share links are
`/d/{token}`. A redirect to the bare homepage would break every invoice link
already sent.

Use a real HTTP 301 at the edge (Cloudflare redirect rule, or an NPM 301 host),
not a forwarding page or meta refresh.

### 6. Search and listings

- Google Search Console: add `marottosolutions.com` as a property, submit the
  new sitemap, then use the **Change of Address** tool on the `marotto.me`
  property. That tool requires the 301 to already be live.
- Update Google Business Profile, any directory listings, and printed material.
- Keep the `marotto.me` redirect in place indefinitely.

## Verification

- [ ] `https://marottosolutions.com` serves the site over a valid certificate
- [ ] `/api/health` returns `env: production` and the expected `commit`
- [ ] `robots.txt` and `sitemap.xml` reference only the new domain
- [ ] Sign-in works; the emailed code arrives
- [ ] An emailed document links to `marottosolutions.com`
- [ ] `curl -sI https://marotto.me/d/SOMETOKEN` returns `301` to the same path
      on the new domain
- [ ] A Stripe test payment records against the invoice
- [ ] Old bookmarks to `marotto.me/admin` land on the new admin

## Rollback

Point the `NEXTAUTH_URL` variable back at `https://marotto.me`, redeploy, and
remove the redirect rule. Nothing in the database or the document store records
the domain, so there is no data to migrate or revert.

## Notes

- Session cookies are host-only, so everyone signed in on `marotto.me` is
  signed out and has to sign in again on the new domain. Expected, not a fault.
- The dev instance is independent: it has its own `NEXTAUTH_URL` in the GitHub
  `dev` environment and can move on its own schedule. See
  [dev-environment.md](dev-environment.md).
