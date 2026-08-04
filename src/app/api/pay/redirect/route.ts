import { NextRequest, NextResponse } from 'next/server';
import { isAllowedPaymentRedirectUrl } from '@/lib/payment-links';

/**
 * Same-origin hop before PayPal / Cash App checkout URLs.
 *
 * iOS/Android universal links only evaluate the *tapped* URL. Routing through
 * our domain prevents the native PayPal/Cash App handlers from swallowing the
 * amount path and opening a bare profile — the browser follows the 302 and
 * loads the amount-prefilled web checkout instead.
 */
export function GET(req: NextRequest) {
    const raw = req.nextUrl.searchParams.get('u');
    if (!raw) {
        return NextResponse.json({ error: 'Missing destination' }, { status: 400 });
    }

    let destination: string;
    try {
        destination = decodeURIComponent(raw);
    } catch {
        return NextResponse.json({ error: 'Invalid destination encoding' }, { status: 400 });
    }

    if (!isAllowedPaymentRedirectUrl(destination)) {
        return NextResponse.json({ error: 'Destination host not allowed' }, { status: 400 });
    }

    return NextResponse.redirect(destination, 302);
}
