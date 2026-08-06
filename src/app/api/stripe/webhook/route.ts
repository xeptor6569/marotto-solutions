import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';
import { getDocumentById } from '@/lib/data';
import { recordInvoicePayment } from '@/lib/invoice-payments';
import { getStripe, getStripeWebhookSecret, isStripeConfigured } from '@/lib/stripe';
import type { PaymentKind } from '@/lib/types';

export const runtime = 'nodejs';

function paymentKindFromMetadata(raw: string | undefined | null): PaymentKind | undefined {
    if (raw === 'down_payment' || raw === 'final' || raw === 'partial') return raw;
    return undefined;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const invoiceId = session.metadata?.invoiceId || session.client_reference_id || '';
    if (!invoiceId) {
        throw new Error('Checkout session missing invoiceId metadata.');
    }

    const invoice = await getDocumentById(invoiceId);
    if (!invoice || invoice.type !== 'invoice') {
        throw new Error(`Invoice ${invoiceId} not found.`);
    }

    const amountTotalCents = session.amount_total;
    if (amountTotalCents == null || amountTotalCents <= 0) {
        throw new Error('Checkout session has no amount_total.');
    }
    const amount = Math.round(amountTotalCents) / 100;

    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

    const result = await recordInvoicePayment({
        invoice,
        amount,
        method: 'Stripe',
        notes: `Paid online via Stripe Checkout (${session.id})`,
        kind: paymentKindFromMetadata(session.metadata?.paymentKind),
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        date: session.created ? new Date(session.created * 1000).toISOString() : undefined,
    });

    if (!result.alreadyRecorded) {
        revalidatePath('/dashboard');
        revalidatePath('/admin');
        revalidatePath('/admin/invoices');
        revalidatePath(`/admin/invoices/${invoice.id}`);
        revalidatePath(`/invoices/${invoice.id}`);
        if (invoice.shareToken) {
            revalidatePath(`/d/${invoice.shareToken}`);
        }
        if (invoice.jobId) {
            revalidatePath(`/admin/jobs/${invoice.jobId}`);
        }
    }

    return result;
}

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
        return NextResponse.json(
            { error: 'STRIPE_WEBHOOK_SECRET is not set. Webhook endpoint is disabled.' },
            { status: 503 },
        );
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
    }

    const rawBody = await request.text();
    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
        console.error('Stripe webhook signature verification failed', error);
        return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.payment_status === 'paid' || session.status === 'complete') {
                const result = await handleCheckoutCompleted(session);
                return NextResponse.json({
                    received: true,
                    alreadyRecorded: result.alreadyRecorded,
                    invoiceId: result.invoice.id,
                    paymentId: result.payment.id,
                });
            }
        }

        return NextResponse.json({ received: true, ignored: event.type });
    } catch (error) {
        console.error('Stripe webhook handler failed', error);
        const message = error instanceof Error ? error.message : 'Webhook handler failed.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
