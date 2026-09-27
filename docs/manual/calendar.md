# Calendar & reminders

## Events

The calendar (requires a database) tracks scheduled work: title, time or all-day, location, assignee, and optional links to a client and job. Events move through **scheduled → confirmed → completed** (or cancelled).

Recurring events support daily, weekly, or monthly repetition with an optional end date or occurrence count.

All times display in your **business timezone** (Settings → Business), regardless of the server's clock.

## Reminders

Give an event a reminder (minutes before start) and the app emails **you** — not the client — when the window arrives. Reminders send once per event, only for events that are still scheduled or confirmed, and **not for recurring events**. Because reminders are checked hourly, one can arrive up to an hour after the time you chose.

Reminders are delivered by `POST /api/cron/calendar` — the bundled Docker stack calls it hourly. The recipient is `OPERATOR_EMAIL`, falling back to the From address ([email settings](../configuration.md#email); [scheduled jobs](../deployment.md#scheduled-jobs)). The dashboard's **Upcoming This Week** card shows the next few days at a glance.
