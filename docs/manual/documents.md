# Estimates, quotes, invoices & receipts

## The document flow

A typical job moves through: **estimate or quote → invoice → receipt.**

- **Estimates** and **quotes** describe proposed work. They support packages (Option A / Option B), material choice groups, and lines pending client approval. Track their pipeline on the board views (Backlog → To Do → In Progress → Done).
- **Invoices** bill for the work. They carry payment methods, due dates, payments, and balance tracking.
- **Receipts** confirm money received. Recording a payment on an invoice can create the receipt automatically.

Each document page opens with a status line saying where it stands and what to do next (for example *Overdue by 4 days · $500.00 outstanding*), and one main action for that state: **Send** a draft, **Send reminder** on an unpaid invoice, **Convert to invoice** on a sent estimate or quote, or **Save PDF** once it's settled. **Edit**, **Email**, and **Copy link** sit next to it; **Deposit invoice**, other conversions, **Save as preset**, printing, and **Delete** are under **⋯** (a bottom sheet on phones).

## Creating documents

Use the **Create** menu (top bar on desktop, center button on the phone nav). On wide screens the editor shows a **live preview** of the finished document next to the form — hide it with the eye icon. On smaller screens, use **Preview** in the action bar.

The editor has two layouts — pick yours in **Settings → Documents**:

- **Guided flow:** one step at a time (Client → Details → Items → Review). Best on phones.
- **Full page:** everything on one page with jump navigation. Best on desktop.

Pick the client and job from searchable lists (type a few letters), or create a job on the spot with **New job**.

When you save:

- **Save draft** (or **Save changes**) keeps the document private. <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd> saves from anywhere in the form.
- **Save & send…** marks it sent and opens the send dialog on the document page: email it from the app, open your mail app, or copy the client link.
- If something is missing, the form stays filled in, tells you what to fix, and jumps to that step. Closing the tab with unsaved changes asks first.

**Presets** (Tools → Presets) store reusable line-item templates. Use **Use a preset** in the Items step — on a document that already has lines you can replace them or add the preset's lines below. On any document you can also use **Save as preset**.

## Options and approvals

- **Packages** are alternative versions of the whole job (Option A / Option B). **Material / method choices** are smaller either/or decisions within it (Flooring: Hardwood or Laminate). The shared document lists every option with its price.
- In the editor, each package, group, and choice is a summary row. Open it to edit the label, a markdown description, and its lines. Reorder or duplicate from the row. Only one package can be marked **Recommended**.
- When the client decides, open the document and record their pick under **Select options** → **Save selection**. **Convert** and **Deposit invoice** bill only what's selected.
- Tick **Needs client approval** on a line for extra work the client hasn't agreed to yet. It shows with a "Pending your approval" badge and its own subtotal, and the email mentions it. Converting to an invoice bills these lines too (you'll be asked first) — remove them if the client declines.

## Numbering

Document numbers are issued automatically. With a database connected, numbering is atomic and safe across concurrent saves; without one, the app scans existing files for the highest number.

The ID format is a prefix plus a zero-padded number (e.g. `INV-0001`). Set the prefix, starting number, and digit width per document type in **Settings → Documents**. Changing a prefix only affects new documents. Numbers never go backwards: the next document uses the starting number or the number after the last one issued, whichever is higher — so to continue from another system, set the starting number to your next number.

## Currency

Every amount — on screen, on printed documents, in emails, and in Stripe charges — uses the currency and number format chosen in **Settings → Business**.

## Sharing and printing

Every document has an unguessable **share link** (`/d/{token}`). Use **Share** to copy or send it — clients can view, print, and (for invoices) pay online without signing in. Use **Email** to send the link from the app when email is configured, or through your own mail app.

The client's page carries your logo and name, call and email buttons, and a contact footer, and always shows in light mode so it matches the printed paper. Invoices open with the amount due and a **Pay now** button (pinned to the bottom of the screen on phones); estimates and quotes offer a way to get in touch to go ahead.

**Print / Save PDF** produces a clean letterhead document — your branding, no app chrome — in both light and dark mode.
