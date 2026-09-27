# Recurring contracts

## What contracts do

A **contract** describes recurring work — a cadence (every N days/months/years), line items, and a customer. The scheduler generates each cycle's invoice automatically when it comes due.

- **Recurring lines** bill the same quantity every cycle.
- **Usage lines** are billed as-used: the generated invoice arrives as a draft and waits in the **Cycles awaiting review** queue on the dashboard until you fill in quantities.
- With **auto-send** enabled, cycle invoices without usage lines are emailed to the customer automatically.

Contracts can be paused, resumed, ended, or cancelled from the contract page, and each contract shows its generated invoice history and progress through the term.

## The scheduler

The scheduler runs via `POST /api/cron/contracts` (the bundled Docker stack calls it daily; see [Scheduled jobs](../deployment.md#scheduled-jobs) to run it from your own cron). You can also trigger a run manually from the Contracts page.

A printable **service agreement** with your letterhead and signature lines is available on every contract, with its own share link for the customer.
