# Payments & Stripe

## Payment methods

**Settings → Billing** controls which payment methods appear on invoices (cash, check, Zelle, Cash App, PayPal, Venmo, Apple Pay, Stripe), their order, handles/links, and notes. Individual invoices can override the global list from the invoice editor.

## Recording payments

Open the invoice and use the **Payments** panel at the top of the page:

- **Record payment** opens a short form — quick 25% / 50% / full-balance chips, amount, date, method (from your enabled payment methods), type (partial, down payment, final), and an optional note. A **receipt is created automatically** and linked from the payment row.
- The invoice's balance and status update immediately; once the balance reaches zero the invoice is **paid**.
- Made a mistake? Use the trash icon on a payment to **remove** it — its receipt is deleted and the balance goes back up. Payments recorded by Stripe cannot be removed here; refund them from the Stripe dashboard instead.
- The panel's **⋯ menu** offers **Mark paid without recording a payment** (write-offs, untracked cash) and, for invoices marked paid that way, **Reopen** so status follows the recorded money again.

You do not need to edit the invoice to log a payment — the editor only shows a read-only balance summary.

## Card payments with Stripe

With `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set on the server, shared invoices get a **Pay with card** flow powered by Stripe Checkout:

- Clients can pay the full balance, a custom amount, a percentage, or an equal split.
- When Stripe confirms the payment, the webhook records it on the invoice, marks it paid when the balance reaches zero, and creates a receipt — do not record the same payment again manually.
- Back on the invoice page the client sees **Confirming your payment…** while the page checks for the webhook for about 30 seconds, then **Payment received** with the updated balance. A cancelled checkout shows a **Try again** link and no charge.

Check **Tools → System** to confirm Stripe is configured (live vs test mode) and the webhook secret is present. Server setup is covered in [Deploying to production](../deployment.md#card-payments-with-stripe).
