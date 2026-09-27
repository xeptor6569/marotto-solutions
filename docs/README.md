# Documentation

Guides for running your own copy of the back-office. Every install also serves them as a website at `/docs`, or at the root of a `docs.` subdomain ([details](deployment.md#documentation-site-optional)).

## Set up & run

| Guide | Read it when |
|---|---|
| [Getting started](getting-started.md) | You want to install the app and try it: requirements, install, setup wizard, first configuration |
| [Configuration](configuration.md) | You need to know what a `.env` variable or a Settings tab does |
| [Deploying to production](deployment.md) | You're putting it on your own domain: HTTPS, email, Stripe, scheduled jobs, monitoring |
| [Backups & upgrades](operations.md) | You're protecting your data, moving servers, or installing a new version |
| [Troubleshooting](troubleshooting.md) | Something isn't working |

## User manual

Day-to-day guides for using the app. The same pages are built into the app under **Tools → Help**, and the small **?** icons next to labels in the app link straight to them.

| Page | Covers |
|---|---|
| [Getting started](manual/getting-started.md) | First sign-in, finding your way around, installing on your phone |
| [Your first job, start to finish](manual/first-job.md) | The everyday workflow: client → job → estimate → invoice → paid |
| [Clients, jobs & helpers](manual/clients-jobs.md) | Contact records, job pages, attachments, time tracking, helper payouts |
| [Estimates, quotes, invoices & receipts](manual/documents.md) | Creating, packages and options, approvals, sharing, converting, numbering |
| [Payments & Stripe](manual/payments.md) | Payment methods, recording and undoing payments, card payments |
| [Website quote requests](manual/quote-requests.md) | How requests from your public site arrive and how to follow up |
| [Recurring contracts](manual/contracts.md) | Scheduled invoicing for repeat work, usage billing, renewals |
| [Calendar & reminders](manual/calendar.md) | Events, recurrence, reminder emails |
| [Branding, theming & public site](manual/branding-theming.md) | Business profile, look and feel, printed documents, marketing site |
| [Storage, backups & import](manual/storage-backups.md) | Where data lives, backups, restore vs import |
| [Troubleshooting](manual/troubleshooting.md) | Using the System page and fixes for common problems |

Integrations (health checks, scheduled jobs, Stripe, backup endpoints) are documented in the app under **Tools → System → API reference**.

## For developers and maintainers

| Guide | Contents |
|---|---|
| [Main README](../README.md#local-development) | Local development, scripts, architecture overview |
| [Dev environment](dev-environment.md) | Running an isolated staging instance next to production |
| [Domain migration](domain-migration.md) | Moving an existing install to a new domain |
