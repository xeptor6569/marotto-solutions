# Work Calendar & Scheduling — Build Plan

This document is the implementation plan for adding a work calendar and scheduling feature to Marotto Solutions. It is intended to be read before starting implementation and updated as work progresses.

**Status:** Planning (not yet implemented)  
**Last updated:** 2026-06-12

---

## 1. Overview

Marotto Solutions is a full-stack Next.js 16 monolith (React 19, TypeScript, Radix Themes, Prisma/PostgreSQL, NextAuth v5). Operational entities like **Jobs** and **Contracts** already live in Prisma with domain logic in `src/lib/*`, admin UI under `src/app/admin/*`, and mutations via server actions.

There is **no calendar UI today**. The closest scheduling behavior is **recurring contracts** (`nextDueDate`, interval math, cron-driven invoice issuance). A work calendar should follow the same Prisma + lib + server actions + admin pages pattern.

### Goals

- Schedule work (site visits, installs, follow-ups, on-site support) on a calendar tied to **clients** and **jobs**.
- Support **timed** and **all-day** events.
- Support **recurring** events (daily / weekly / monthly) with correct date math.
- Send **email reminders** via the existing cron pipeline.
- Store times in **UTC**; display and parse in a single configured **business timezone**.
- Guard scheduling edge cases with a **lightweight Vitest** test suite.

### Default scope decisions

These defaults apply unless explicitly changed before implementation:

| Decision | Choice |
|----------|--------|
| First version scope | Single + recurring events, client/job links, month/week/list views, email reminders |
| Timezone | Single fixed business timezone (`businessTimezone` in settings); UTC in DB |
| Calendar UI | Custom grid built with Radix Themes + `date-fns` (no FullCalendar dependency) |
| Staff assignment | Single operator for now; optional `assignee` field on events for future multi-staff |

---

## 2. Current codebase anchors

Use these as patterns when implementing:

| Concern | Reference |
|---------|-----------|
| Prisma models | `prisma/schema.prisma` (`Job`, `Contract`) |
| Domain logic | `src/lib/contracts.ts`, `src/lib/jobs.ts` |
| Types | `src/lib/types.ts` |
| Server actions | `src/app/admin/contracts/actions.ts` |
| Admin pages | `src/app/admin/contracts/page.tsx` |
| Cron endpoint | `src/app/api/cron/contracts/route.ts` |
| Cron sidecar | `docker-compose.yml` |
| Manual scheduler UI | `src/components/RunSchedulerButton.tsx` |
| Admin navigation | `src/components/AdminShell.tsx` |
| Settings persistence | `src/lib/config.ts` → `data/config/settings.json` |
| Client/job pickers | `src/lib/document-form-pickers.ts` |
| Date library (installed) | `date-fns@4` (currently unused in `src/`) |

**Architectural choice:** Calendar events belong on the **Prisma path** (like Jobs/Contracts), not JSON documents. Events need date-range queries, status filtering, and FK relationships.

---

## 3. Data model

Add a `CalendarEvent` model to `prisma/schema.prisma` and back-relations on `Client` and `Job`.

```prisma
model CalendarEvent {
  id                    String    @id @default(uuid())
  title                 String
  description           String?
  status                String    @default("scheduled") // scheduled | confirmed | completed | cancelled
  start                 DateTime  // stored UTC
  end                   DateTime  // stored UTC
  allDay                Boolean   @default(false)
  location              String?
  assignee              String?   // optional; future multi-staff
  clientId              String?
  jobId                 String?
  client                Client?   @relation(fields: [clientId], references: [id], onDelete: SetNull)
  job                   Job?      @relation(fields: [jobId], references: [id], onDelete: SetNull)
  recurrenceRule        String?   // encoded recurrence; expanded at read time
  reminderMinutesBefore Int?
  reminderSentAt        DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([start])
  @@index([end])
  @@index([clientId])
  @@index([jobId])
  @@index([status])
}
```

Add to `Client` and `Job`:

```prisma
events CalendarEvent[]
```

### Status values

| Status | Meaning |
|--------|---------|
| `scheduled` | Default; event is on the calendar |
| `confirmed` | Customer/operator confirmed |
| `completed` | Work finished |
| `cancelled` | Soft-cancelled; hidden from default views |

### Recurrence encoding (`recurrenceRule`)

Store a simple JSON string (not full iCal RRULE in v1) to keep expansion logic testable:

```json
{
  "frequency": "weekly",
  "interval": 1,
  "until": "2026-12-31T00:00:00.000Z",
  "count": null
}
```

Supported `frequency` values: `daily`, `weekly`, `monthly`.

- `interval`: repeat every N units (default 1).
- `until`: optional end date (UTC).
- `count`: optional max occurrences (alternative to `until`).

**Read-side expansion:** When querying a date range, expand recurring series into virtual occurrences within `[from, to]`. Persist only the series master row; do not materialize every occurrence in the DB for v1.

### Migration

- New migration under `prisma/migrations/YYYYMMDDHHMMSS_add_calendar_events/`
- Run `npm run prisma:migrate:dev` locally; deploy with `prisma:migrate:deploy` in Docker.

---

## 4. Timezone handling

### Principle

- **Store:** all `start` / `end` as UTC `DateTime` in PostgreSQL.
- **Configure:** one IANA timezone for the business (e.g. `America/New_York`).
- **Convert at edges:** form input and display only; domain math uses UTC instants.

### Settings

Add `businessTimezone` to app settings in `src/lib/config.ts`:

```ts
businessTimezone: string; // default: "America/New_York"
```

Surface in `/admin/settings` with a short help note: “All calendar times are shown in this timezone.”

### Library

Add **`date-fns-tz`** (companion to existing `date-fns`):

| Operation | Function |
|-----------|----------|
| Form wall-clock → UTC | `fromZonedTime(localDate, businessTimezone)` |
| UTC → wall-clock for display | `toZonedTime(utcDate, businessTimezone)` |
| Format for UI | `formatInTimeZone(utcDate, businessTimezone, pattern)` |

### All-day events

- Store `start` at **00:00:00** and `end` at **23:59:59.999** (or next-day exclusive boundary — pick one convention and document in tests).
- Set `allDay: true`; UI shows date only, no time inputs.
- Recurrence for all-day events advances by calendar day in the business timezone.

### DST

Recurrence and grid boundaries must be tested across DST transitions (spring forward, fall back). `date-fns-tz` resolves offsets at conversion time; unit tests are required (see §6).

---

## 5. Domain layer — `src/lib/calendar.ts`

Mirror `src/lib/contracts.ts` structure.

### Types

Export `CalendarEventRecord` (mapped from Prisma) and reuse `CalendarEventInput` / status enums from `src/lib/types.ts`.

### Core functions

| Function | Purpose |
|----------|---------|
| `listEventsInRange(from, to, options?)` | Query events overlapping range; expand recurrence |
| `getEvent(id)` | Single event with client/job includes |
| `createEvent(input)` | Validate, convert wall-clock → UTC, persist |
| `updateEvent(id, input)` | Same validation path |
| `deleteEvent(id)` | Hard delete (or soft via `cancelled` — prefer status update for audit) |
| `cancelEvent(id)` | Set `status = cancelled` |

### Scheduling helpers

| Function | Purpose |
|----------|---------|
| `advanceRecurrence(anchor, rule)` | Next occurrence after `anchor` |
| `expandRecurrence(event, from, to)` | Return occurrence instants in range |
| `eventsOverlap(a, b)` | Overlap detection for conflicts (optional UI warning) |
| `getMonthGrid(year, month, tz)` | Week rows for calendar month view |
| `getEventsNeedingReminder(now)` | Events where reminder window is due and `reminderSentAt` is null |

### Validation rules

- `end` must be after `start` (or equal for zero-duration if allowed).
- Recurring events require valid `recurrenceRule`.
- `reminderMinutesBefore` must be ≥ 0 when set.
- Linked `clientId` / `jobId` must exist when provided.

---

## 6. Testing harness (Vitest)

### Risk addressed

Scheduling bugs (DST, month-end recurrence, overlap, reminder windows) are easy to introduce and hard to catch manually. The repo currently has **no automated tests**. This feature adds a minimal Vitest setup focused on `src/lib/calendar.ts`.

### Setup

**Dev dependencies:**

- `vitest`
- `@vitest/coverage-v8` (optional but useful)

**`package.json` scripts:**

```json
"test": "vitest run",
"test:watch": "vitest"
```

**`vitest.config.ts`:**

- `environment: 'node'`
- Path alias `@/*` → `./src/*` (match `tsconfig.json`)

**Test file:** `src/lib/__tests__/calendar.test.ts`

### Test cases

#### Interval / recurrence math

- Daily: every 1 day, every 3 days.
- Weekly: same weekday, `interval > 1`.
- Monthly: same day-of-month; **Jan 31 → Feb 28/29** rollover.
- `until` cutoff: no occurrences after end date.
- `count` cutoff: exactly N occurrences.
- Range expansion: occurrences on range boundaries (inclusive start, exclusive end — document chosen convention).

#### Overlap detection

- Partial overlap vs adjacent (end === start) vs fully contained.
- All-day vs timed event overlap.

#### Timezone conversions

- Wall-clock → UTC → wall-clock round-trip in `America/New_York`.
- **DST spring forward:** event at 2:30 AM on transition day (invalid/skipped local time — define expected behavior).
- **DST fall back:** ambiguous local time — define expected behavior (prefer earlier offset or document).
- All-day event stored boundaries in UTC for a given business date.

#### Reminder window

- Event with `reminderMinutesBefore: 60` triggers when `now` is within window.
- `reminderSentAt` set → not returned again by `getEventsNeedingReminder`.

### CI

Add `npm test` to `.github/workflows/` (deploy or a dedicated check job) so calendar logic regressions fail the pipeline.

---

## 7. Server actions

**File:** `src/app/admin/calendar/actions.ts`

| Action | Behavior |
|--------|----------|
| `createCalendarEventAction` | Parse form, convert times, `createEvent`, `revalidatePath` |
| `updateCalendarEventAction` | Same for edits |
| `cancelCalendarEventAction` | Set status cancelled |
| `deleteCalendarEventAction` | Hard delete if needed |
| `runCalendarRemindersAction` | Manual trigger (mirrors `runContractSchedulerAction`) |

Revalidate paths:

- `/admin/calendar`
- `/admin/calendar/[id]`
- `/admin` (dashboard widget)

Wrap in try/catch; return `{ success, error }` like job/contract actions.

---

## 8. Admin UI

### Routes

| Route | File | Description |
|-------|------|-------------|
| `/admin/calendar` | `src/app/admin/calendar/page.tsx` | Main calendar (month/week/list) |
| `/admin/calendar/[id]` | `src/app/admin/calendar/[id]/page.tsx` | Event detail, edit, cancel |

### Components

| Component | File | Notes |
|-----------|------|-------|
| `CalendarView` | `src/components/CalendarView.tsx` | `'use client'`; grid, navigation, click-to-create |
| `CalendarEventForm` | `src/components/CalendarEventForm.tsx` | Radix `Dialog`; date/time or all-day toggle; client/job pickers |
| `CalendarEventStatusButtons` | `src/components/CalendarEventStatusButtons.tsx` | Confirm / complete / cancel |
| `RunCalendarRemindersButton` | `src/components/RunCalendarRemindersButton.tsx` | Optional manual reminder run |

### Views (v1)

1. **Month** — default; 7-column grid, events as chips per day.
2. **Week** — timed rows (or all-day band + hourly slots simplified).
3. **List** — chronological list for mobile-friendly scanning.

Navigation via URL search params: `?view=month&year=2026&month=6`.

### Navigation entry

Add to `src/components/AdminShell.tsx`:

- Desktop: `Calendar` with Lucide `Calendar` icon → `/admin/calendar`
- Mobile: include in bottom nav or More menu

### Dashboard widget

On `src/app/admin/page.tsx`:

- **“Upcoming this week”** — next 7 days of non-cancelled events (reuse stat-card / recent-list pattern from contracts).

---

## 9. Reminders & cron

### Email

Add `sendCalendarEventReminderEmail` in `src/lib/email.ts` (or extend existing email module):

- To: operator email from env or settings (single operator v1).
- Subject/body: event title, start time in business timezone, client/job links, location.

### Cron endpoint

**File:** `src/app/api/cron/calendar/route.ts`

- Reuse `CRON_SECRET` guard from `src/app/api/cron/contracts/route.ts`.
- Call `getEventsNeedingReminder(now)` → send emails → set `reminderSentAt`.
- Support GET and POST for sidecar compatibility.

### Docker

In `docker-compose.yml`, add cron schedule for calendar reminders (e.g. every 15 minutes or hourly — tune based on `reminderMinutesBefore` granularity):

```yaml
# Example: every hour at :00
0 * * * * wget -qO- --header="X-Cron-Secret: $CRON_SECRET" http://web:3000/api/cron/calendar
```

Document `CALENDAR_CRON_SCHEDULE` env override in `README.md`.

---

## 10. Implementation phases

### Phase 1 — Data, domain, timezone, tests

1. Add `CalendarEvent` model + migration; `prisma generate`.
2. Add types to `src/lib/types.ts`.
3. Add `businessTimezone` to `src/lib/config.ts` + settings UI.
4. Install `date-fns-tz`.
5. Implement `src/lib/calendar.ts` (CRUD, recurrence, reminders query, tz helpers).
6. Stand up Vitest + `src/lib/__tests__/calendar.test.ts`; all tests green before Phase 2.

**Exit criteria:** `npm test` passes; can create/query events programmatically with correct UTC storage and recurrence expansion.

### Phase 2 — Admin UI

7. `src/app/admin/calendar/actions.ts`
8. Calendar page + `CalendarView` + `CalendarEventForm`
9. Event detail page + status buttons
10. `AdminShell` nav entry
11. Dashboard “Upcoming this week” widget

**Exit criteria:** Operator can create, view, edit, and cancel events in the admin calendar; times display in business timezone.

### Phase 3 — Reminders

12. `sendCalendarEventReminderEmail`
13. `src/app/api/cron/calendar/route.ts`
14. Docker cron sidecar entry + `RunCalendarRemindersButton`
15. Reminder tests in `calendar.test.ts`

**Exit criteria:** Reminders fire via cron and manual button; `reminderSentAt` prevents duplicates.

### Phase 4 — Documentation

16. Update `README.md` (routes, env vars, cron, `businessTimezone`, `npm test`).
17. Add entry to `CHAT_CONTEXT.md` when implementation ships.

---

## 11. File manifest (new / modified)

### New files

```
prisma/migrations/..._add_calendar_events/migration.sql
src/lib/calendar.ts
src/lib/__tests__/calendar.test.ts
src/app/admin/calendar/page.tsx
src/app/admin/calendar/[id]/page.tsx
src/app/admin/calendar/actions.ts
src/components/CalendarView.tsx
src/components/CalendarEventForm.tsx
src/components/CalendarEventStatusButtons.tsx
src/components/RunCalendarRemindersButton.tsx
src/app/api/cron/calendar/route.ts
vitest.config.ts
docs/work-calendar-plan.md  (this file)
```

### Modified files

```
prisma/schema.prisma
package.json
src/lib/types.ts
src/lib/config.ts
src/components/AdminShell.tsx
src/app/admin/page.tsx
src/app/admin/settings/page.tsx  (or settings form component)
src/lib/email.ts
docker-compose.yml
.github/workflows/deploy.yml  (or new test workflow)
README.md
CHAT_CONTEXT.md  (post-implementation)
```

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| DST / timezone bugs | UTC storage + `date-fns-tz`; explicit unit tests for spring/fall transitions |
| Recurrence edge cases (month-end, leap year) | Dedicated Vitest cases; document chosen behavior |
| No existing test culture | Small Vitest setup scoped to `calendar.ts`; add CI step |
| Reminder duplicate sends | Set `reminderSentAt` atomically after send; test idempotency |
| Performance with many recurring series | Cap expansion per query; index `start`/`end`; paginate list view |
| UI complexity without calendar library | Start with month + list; week view can be simplified (no drag-drop in v1) |

---

## 13. Out of scope (v1)

- Customer-facing booking / self-scheduling portal
- Google Calendar / Outlook sync
- Drag-and-drop reschedule on calendar grid
- Multi-timezone per event
- Full iCal RRULE import/export
- Resource/room booking (beyond optional `assignee` string)
- Conflict blocking (overlap may warn but not prevent save in v1)

---

## 14. Acceptance checklist

- [ ] `CalendarEvent` migrated; Prisma client generated
- [ ] `businessTimezone` configurable in settings; default `America/New_York`
- [ ] Events stored UTC; UI shows business local time
- [ ] Create/edit/cancel events linked to client and/or job
- [ ] Month, week, and list views on `/admin/calendar`
- [ ] Recurring daily/weekly/monthly events expand correctly in queried ranges
- [ ] `npm test` passes (recurrence, overlap, timezone, reminders)
- [ ] CI runs tests
- [ ] Email reminders via `/api/cron/calendar` + Docker cron
- [ ] Admin dashboard shows upcoming events
- [ ] README documents new routes, settings, and cron schedule

---

## 15. Suggested implementation order (single PR or stacked PRs)

**PR 1 — Foundation:** schema, `calendar.ts`, config timezone, Vitest, tests green.  
**PR 2 — UI:** admin pages, components, nav, dashboard widget.  
**PR 3 — Reminders:** email, cron route, Docker, manual button, reminder tests.

This keeps reviewable chunks and ensures logic is tested before UI depends on it.
