# Estimates, quotes, invoices & receipts

## The document flow

A typical job moves through: **estimate or quote → invoice → receipt.**

- **Estimates** and **quotes** describe proposed work. They support packages (Option A / Option B), material choice groups, and lines pending client approval. Track their pipeline on the board views (Backlog → To Do → In Progress → Done).
- **Invoices** bill for the work. They carry payment methods, due dates, payments, and balance tracking.
- **Receipts** confirm money received. Recording a payment on an invoice can create the receipt automatically.

From an estimate or quote's actions menu (**⋯**), use **Convert** to turn it into a quote or invoice (selected options carry over), or **Deposit invoice** to bill a percentage or fixed amount up front.

## Creating documents

Use the **Create** menu (top bar on desktop, center button on the phone nav). The editor has two layouts — pick yours in **Settings → Documents**:

- **Guided flow:** one step at a time (Customer → Details → Items → Review). Best on phones.
- **Full page:** everything on one page with jump navigation. Best on desktop.

**Presets** (Tools → Presets) store reusable line-item templates. On any document you can also use **Save as preset**.

## Options and approvals

- **Packages** are alternative versions of the whole job (Option A / Option B). **Material / method choices** are smaller either/or decisions within it (Flooring: Hardwood or Laminate). The shared document lists every option with its price.
- When the client decides, open the document and record their pick under **Select options** → **Save selection**. **Convert** and **Deposit invoice** bill only what's selected.
- Tick **Needs client approval** on a line for extra work the client hasn't agreed to yet. It shows with a "Pending your approval" badge and its own subtotal, and the email mentions it. Converting to an invoice bills these lines too (you'll be asked first) — remove them if the client declines.

## Numbering

Document numbers are issued automatically. With a database connected, numbering is atomic and safe across concurrent saves; without one, the app scans existing files for the highest number.

The ID format is a prefix plus a zero-padded number (e.g. `INV-0001`). Set the prefix, starting number, and digit width per document type in **Settings → Documents**. Changing a prefix only affects new documents. Numbers never go backwards: the next document uses the starting number or the number after the last one issued, whichever is higher — so to continue from another system, set the starting number to your next number.

## Currency

Every amount — on screen, on printed documents, in emails, and in Stripe charges — uses the currency and number format chosen in **Settings → Business**.

## Sharing and printing

Every document has an unguessable **share link** (`/d/{token}`). Use **Share** to copy or send it — clients can view, print, and (for invoices) pay online without signing in. Use **Email** to send the link from the app when email is configured, or through your own mail app.

**Print / Save PDF** produces a clean letterhead document — your branding, no app chrome — in both light and dark mode.
