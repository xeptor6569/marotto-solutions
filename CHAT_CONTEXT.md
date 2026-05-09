# Chat Context

This file is a running summary of recent assistant work so future chats can pick up project context faster.

## How To Use

- Read this before starting follow-up implementation chats.
- Add new entries at the top.
- Keep summaries focused on behavior changes, important files, and follow-up risks.

## 2026-05-09

### Settings save and config persistence in Docker
- Moved `CONFIG_PATH` in `src/lib/config.ts` to `data/config/settings.json` so the unprivileged `nextjs` user can write to it inside Docker (the previous `config/` dir lived under root-owned `/app`). Legacy `config/settings.json` is still read as a one-time fallback.
- Wrapped `saveSettingsAction` in `src/app/actions.ts` in try/catch so unexpected save failures surface as inline errors instead of a 500.
- Updated `Dockerfile` to pre-create `data/config` with `nextjs:nodejs` ownership.

### Robust job creation
- `createJobAction` in `src/app/actions.ts` now catches Prisma/database failures and returns `{ success: false, error }` instead of throwing.
- `createJobFromFormAction` in `src/app/admin/jobs/actions.ts` redirects back to `/admin/jobs/create` with the error and form values preserved.
- `src/app/admin/jobs/create/page.tsx` shows a red `Callout` for the redirect error and rehydrates name/description/status.

### Lead edit and delete
- Added `updateLeadAction` and `deleteLeadAction` in `src/app/actions.ts`, using new `deleteDocument` in `src/lib/data.ts` and `deleteDocumentRemote` in `src/lib/webdav.ts`.
- New components: `src/components/LeadEditDialog.tsx` (Radix dialog form) and `src/components/DeleteLeadButton.tsx` (Radix `AlertDialog` with optional redirect).
- `src/components/AdminDocumentList.tsx` now renders Edit/Delete actions on the lead rows in both the mobile cards and desktop table.
- `src/app/admin/leads/[id]/page.tsx` exposes the same Edit/Delete actions in the detail header alongside "Create job from client".

### Optional details on every line item
- `src/components/NewInvoiceForm.tsx` now shows the `details` textarea for invoices, quotes, and receipts (previously estimates only) with type-specific placeholders. `DocumentPreview` already rendered `item.details` for every type, so saved details now appear on invoices/receipts as well.

### Lint/type cleanup
- Replaced `catch (error: any)` in `src/lib/data.ts` with a typed narrow.
- Removed unused `CONFIG_FILE` constant and the `as any[]` cast in `src/lib/webdav.ts` (typed file list explicitly).

## 2026-04-02

### Billing config and document titles
- Extended `src/lib/types.ts` and `src/lib/config.ts` with a reusable billing configuration for invoice payment options.
- Updated `src/app/settings/settings-form.tsx` and `src/app/admin/settings/settings-form.tsx` so billing handles/notes can be edited from settings.
- Updated `src/app/actions.ts` so settings can save billing config and documents can persist an optional `title` while keeping immutable numeric IDs.
- Updated `src/components/NewInvoiceForm.tsx` to allow an editable display title for invoices, estimates, and receipts.
- Updated `src/components/DocumentPreview.tsx` so invoices now show configured payment options/instructions and document headers render `ID - Title` when a title exists.
- Surfaced titles in list/dashboard UIs via `src/components/AdminDocumentList.tsx`, `src/app/admin/page.tsx`, and `src/app/dashboard/page.tsx`.

### Share action for document previews
- Added `src/components/ShareButton.tsx`.
- Updated `src/components/DocumentPreview.tsx` to show a `Share` action next to `Print`.
- Share behavior uses the browser share sheet when available and falls back to copying the link.
- Admin previews now share the public document route such as `/invoices/{id}` instead of the `/admin/...` URL, which is better for sending to clients by text/email.

### Auth redirect and URL alignment
- Fixed sign-in redirect behavior in `src/app/auth/signin/page.tsx` so successful credential sign-in stays on the current browser origin instead of jumping to a mismatched absolute auth URL.
- Updated `.env`, `.env.example`, `docker-compose.yml`, and `README.md` so `NEXTAUTH_URL` stays aligned with `APP_PORT`.
- Goal: prevent port-switching during sign-in and avoid `ERR_CONNECTION_REFUSED` caused by auth URL drift.

### Dashboard and document UX pass
- Fixed overflowing settings action in `src/app/admin/page.tsx` and `src/app/dashboard/page.tsx` by making the header actions wrap better and labeling the settings button.
- Added top summary cards to both dashboard surfaces for quicker scanning.
- Improved print and preview readability in `src/components/DocumentPreview.tsx` by increasing contrast for headings, labels, totals, and status display.

### Invoice and estimate save flow
- Updated `src/components/NewInvoiceForm.tsx` and `src/app/actions.ts` so documents are no longer always saved as `draft`.
- Invoice actions now support `Save Draft`, `Save as Sent`, and `Save as Paid`.
- Estimate actions now support `Save Draft` and `Save & Finalize`.

### Richer estimate content
- Extended `src/lib/types.ts` line items with optional `details`.
- Added document-level notes/project details and per-line-item detailed text in `src/components/NewInvoiceForm.tsx`.
- Rendered those richer estimate details in `src/components/DocumentPreview.tsx` so clients can see scope, approach, and material/options information clearly.

### Documentation refresh
- Rewrote `README.md` to match the current codebase: NextAuth auth flow, Prisma/Postgres usage, WebDAV/local JSON storage, route layout, docker setup, and current document workflows.

## Suggested Follow-Up

- If routing is consolidated later, update both `README.md` and this file.
- If document statuses expand further, update the form action summary above.
