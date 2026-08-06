'use client';

import { Button } from '@radix-ui/themes';
import type { PaymentMethodKey } from '@/lib/types';
import { paymentClickHref, paymentMethodNeedsBrowserHandoff, toMoneyAmount } from '@/lib/payment-links';

/**
 * Invoice tap-to-pay control.
 *
 * - Venmo / Stripe: navigate directly (same tab) so universal links keep params.
 * - PayPal / Cash App: same-origin redirect hop so the native app does not steal
 *   the link and drop the amount — browser opens the amount-prefilled checkout.
 * - Also copies the amount for Cash App as a fallback if the pay sheet is blank.
 */
export default function PaymentDeepLinkButton({
    methodKey,
    externalHref,
    amount,
}: {
    methodKey: PaymentMethodKey;
    externalHref: string;
    amount: number;
}) {
    const label = `Pay $${toMoneyAmount(amount)}`;
    const href = paymentClickHref(methodKey, externalHref);

    const onClick = async () => {
        if (methodKey === 'cashApp' || methodKey === 'paypal') {
            try {
                await navigator.clipboard.writeText(toMoneyAmount(amount));
            } catch {
                // Clipboard is best-effort; checkout URL still carries the amount.
            }
        }
    };

    return (
        <Button asChild size="2" className="no-print">
            {/*
              Same-tab navigation (no target=_blank): new-tab / noreferrer opens
              often make Cash App / PayPal land on the app home/profile and drop
              the amount path. Venmo keeps working with same-tab UL handoff.
            */}
            <a
                href={href}
                rel={paymentMethodNeedsBrowserHandoff(methodKey) ? 'noopener' : 'noreferrer'}
                onClick={onClick}
            >
                {label}
            </a>
        </Button>
    );
}
