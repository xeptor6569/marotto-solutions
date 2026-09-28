'use client';

import { Button, Text } from '@radix-ui/themes';
import { useMoney } from '@/components/MoneyProvider';

/** Phone-only sticky bar keeping the amount due and Pay now in reach while scrolling. */
export default function ClientPayBar({ amount }: { amount: number }) {
    const { format } = useMoney();
    return (
        <div className="client-paybar no-print" role="region" aria-label="Pay this invoice">
            <div>
                <span className="ui-eyebrow">Amount due</span>
                <Text as="div" size="4" className="ui-display">{format(amount)}</Text>
            </div>
            <Button asChild size="3">
                <a href="#payment-options">Pay now</a>
            </Button>
        </div>
    );
}
