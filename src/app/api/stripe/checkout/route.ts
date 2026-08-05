import { NextResponse, type NextRequest } from 'next/server';
import { getDocumentByShareToken } from '@/lib/data';
import { getAppConfig } from '@/lib/config';
import {
    parseStripeCheckoutMode,
    resolveStripeCheckoutAmount,
    toStripeUnitAmount,
} from '@/lib/stripe-checkout';
import { getAppBaseUrl, getStripe, isStripeConfigured } from '@/lib/stripe';
import { buildSharePath } from '@/lib/share-token';

export const runtime = 'nodejs';

function badRequest(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return badRequest('Stripe is not configured on this server.', 503);
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return badRequest('Invalid JSON body.');
    }

    const shareToken = typeof body.shareToken === 'string' ? body.shareToken.trim() : '';
    if (!shareToken || shareToken.length < 16) {
        return badRequest('Missing or invalid share token.');
    }

    const mode = parseStripeCheckoutMode(body.mode) || 'full';
    const doc = await getDocumentByShareToken(shareToken);
    if (!doc || doc.type !== 'invoice') {
        return badRequest('Invoice not found.', 404);
    }
    if (doc.status === 'void') {
        return badRequest('This invoice has been voided.');
    }
    if (doc.shareToken !== shareToken) {
        return badRequest('Invoice not found.', 404);
    }

    const config = await getAppConfig();
    const stripeMethod = config.billing?.paymentMethods?.stripe;
    const overrides = doc.paymentOverrides;
    const stripeAllowed =
        overrides?.customizeMethods && Array.isArray(overrides.enabledMethods)
            ? overrides.enabledMethods.includes('stripe') || Boolean(overrides.stripeLink)
            : stripeMethod?.enabled !== false;
    // Coming-soon is ignored when Checkout API keys are present — env is source of truth.
    if (!stripeAllowed) {
        return badRequest('Stripe payments are not enabled for this invoice.');
    }

    const paidAmount =
        doc.paidAmount ?? doc.payments?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0;
    const balanceDue = doc.balanceDue ?? Math.max(0, doc.total - paidAmount);

    const resolved = resolveStripeCheckoutAmount({
        mode,
        invoiceTotal: doc.total,
        balanceDue,
        amount: typeof body.amount === 'number' ? body.amount : Number(body.amount),
        percent: typeof body.percent === 'number' ? body.percent : Number(body.percent),
        splitCount: typeof body.splitCount === 'number' ? body.splitCount : Number(body.splitCount),
    });
    if (resolved.error) {
        return badRequest(resolved.error);
    }

    const unitAmount = toStripeUnitAmount(resolved.amount);
    if (unitAmount < 50) {
        // Stripe Card payments require at least $0.50 USD.
        return badRequest('Stripe requires a minimum charge of $0.50.');
    }

    const baseUrl = getAppBaseUrl();
    const sharePath = buildSharePath(shareToken);
    const successUrl = `${baseUrl}${sharePath}?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${sharePath}?stripe=cancelled`;

    try {
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: doc.customer.email?.trim() || undefined,
            client_reference_id: doc.id,
            metadata: {
                invoiceId: doc.id,
                shareToken,
                paymentKind: resolved.kind,
                amountDollars: resolved.amount.toFixed(2),
            },
            payment_intent_data: {
                metadata: {
                    invoiceId: doc.id,
                    shareToken,
                    paymentKind: resolved.kind,
                },
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: unitAmount,
                        product_data: {
                            name: `Invoice ${doc.id}`,
                            description:
                                resolved.kind === 'final'
                                    ? `Balance due for ${doc.id}`
                                    : resolved.kind === 'down_payment'
                                      ? `Down payment for ${doc.id}`
                                      : `Partial payment for ${doc.id}`,
                        },
                    },
                },
            ],
        });

        if (!session.url) {
            return badRequest('Stripe did not return a Checkout URL.', 502);
        }

        return NextResponse.json({
            url: session.url,
            sessionId: session.id,
            amount: resolved.amount,
            kind: resolved.kind,
        });
    } catch (error) {
        console.error('Stripe Checkout session create failed', error);
        const message = error instanceof Error ? error.message : 'Failed to start Stripe Checkout.';
        return badRequest(message, 502);
    }
}
