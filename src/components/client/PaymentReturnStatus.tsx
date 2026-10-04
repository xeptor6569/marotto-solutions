'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, Spinner, Text } from '@radix-ui/themes';
import { CheckCircle2, CircleAlert, Clock } from 'lucide-react';

// Stripe's webhook usually lands within seconds; back off for ~30s total.
const REFRESH_DELAYS_MS = [1500, 2500, 4000, 6000, 8000, 9000];

/**
 * Banner after returning from Stripe Checkout. On success it re-fetches the
 * page until the webhook has recorded the payment, so the client sees the
 * balance change instead of being told to refresh.
 */
export default function PaymentReturnStatus({
    status,
    paid,
}: {
    status: 'success' | 'cancelled';
    paid: boolean;
}) {
    const router = useRouter();
    const [attempt, setAttempt] = useState(0);
    const waiting = status === 'success' && !paid && attempt < REFRESH_DELAYS_MS.length;

    useEffect(() => {
        if (!waiting) return;
        const timer = window.setTimeout(() => {
            router.refresh();
            setAttempt((n) => n + 1);
        }, REFRESH_DELAYS_MS[attempt]);
        return () => window.clearTimeout(timer);
    }, [waiting, attempt, router]);

    if (status === 'cancelled') {
        return (
            <div className="client-status no-print" data-tone="warning" role="status">
                <CircleAlert size={20} />
                <div>
                    <Text as="div" size="3" weight="bold">Checkout cancelled</Text>
                    <Text as="div" size="2">No charge was made. You can pay whenever you&apos;re ready.</Text>
                </div>
                <Button asChild variant="soft" color="amber"><a href="#payment-options">Try again</a></Button>
            </div>
        );
    }

    if (paid) {
        return (
            <div className="client-status no-print" data-tone="success" role="status">
                <CheckCircle2 size={20} />
                <div>
                    <Text as="div" size="3" weight="bold">Payment received — thank you!</Text>
                    <Text as="div" size="2">This invoice now shows your payment. You can print or save it for your records.</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="client-status no-print" data-tone="info" role="status" aria-live="polite">
            {waiting ? <Spinner size="3" /> : <Clock size={20} />}
            <div>
                <Text as="div" size="3" weight="bold">{waiting ? 'Confirming your payment…' : 'Payment submitted'}</Text>
                <Text as="div" size="2">
                    {waiting
                        ? 'Stripe confirmed the charge. This page updates on its own in a few seconds.'
                        : 'Stripe confirmed the charge. It can take a minute to show here — you can safely close this page.'}
                </Text>
            </div>
            {!waiting ? (
                <Flex flexShrink="0">
                    <Button variant="soft" onClick={() => { setAttempt(0); router.refresh(); }}>Check again</Button>
                </Flex>
            ) : null}
        </div>
    );
}
