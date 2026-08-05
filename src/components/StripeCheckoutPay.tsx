'use client';

import { useEffect, useState, useTransition } from 'react';
import { Badge, Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { CreditCard } from 'lucide-react';
import {
    resolveStripeCheckoutAmount,
    type StripeCheckoutMode,
} from '@/lib/stripe-checkout';

type Props = {
    shareToken: string;
    invoiceId: string;
    invoiceTotal: number;
    balanceDue: number;
    label?: string;
    note?: string;
};

export default function StripeCheckoutPay({
    shareToken,
    invoiceId,
    invoiceTotal,
    balanceDue,
    label = 'Stripe',
    note,
}: Props) {
    const [mode, setMode] = useState<StripeCheckoutMode>('full');
    const [showPartial, setShowPartial] = useState(false);
    const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : '');
    const [percent, setPercent] = useState('50');
    const [splitCount, setSplitCount] = useState('2');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!showPartial) {
            setMode('full');
            setAmount(balanceDue > 0 ? balanceDue.toFixed(2) : '');
        }
    }, [balanceDue, showPartial]);

    const preview = resolveStripeCheckoutAmount({
        mode: showPartial ? mode : 'full',
        invoiceTotal,
        balanceDue,
        amount: Number(amount),
        percent: Number(percent),
        splitCount: Number(splitCount),
    });
    const chargeAmount = preview.error ? null : preview.amount;

    const startCheckout = () => {
        setError('');
        const resolved = resolveStripeCheckoutAmount({
            mode: showPartial ? mode : 'full',
            invoiceTotal,
            balanceDue,
            amount: Number(amount),
            percent: Number(percent),
            splitCount: Number(splitCount),
        });
        if (resolved.error) {
            setError(resolved.error);
            return;
        }

        startTransition(async () => {
            try {
                const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shareToken,
                        mode: showPartial ? mode : 'full',
                        amount: Number(amount),
                        percent: Number(percent),
                        splitCount: Number(splitCount),
                    }),
                });
                const data = (await res.json().catch(() => ({}))) as {
                    url?: string;
                    error?: string;
                };
                if (!res.ok || !data.url) {
                    setError(data.error || 'Could not start Stripe Checkout.');
                    return;
                }
                window.location.href = data.url;
            } catch {
                setError('Could not start Stripe Checkout. Please try again.');
            }
        });
    };

    if (balanceDue <= 0) {
        return (
            <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                    <Box
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#eef2ff',
                            color: '#1e3a5f',
                            flexShrink: 0,
                        }}
                    >
                        <CreditCard size={16} />
                    </Box>
                    <Text as="div" size="2" weight="bold" style={{ color: '#111827' }}>
                        {label}
                    </Text>
                    <Badge color="green" size="1">Paid</Badge>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex direction="column" gap="2">
            <Flex justify="between" align="center" gap="2" wrap="wrap">
                <Flex align="center" gap="2">
                    <Box
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#eef2ff',
                            color: '#1e3a5f',
                            flexShrink: 0,
                        }}
                    >
                        <CreditCard size={16} />
                    </Box>
                    <Text as="div" size="2" weight="bold" style={{ color: '#111827' }}>
                        {label}
                    </Text>
                </Flex>
            </Flex>

            <Text as="div" size="1" style={{ color: '#374151', lineHeight: 1.35 }}>
                Secure card payment for invoice {invoiceId}. Default is the full balance due.
            </Text>

            {showPartial ? (
                <Flex direction="column" gap="2">
                    <Flex gap="2" wrap="wrap">
                        <Button
                            type="button"
                            size="1"
                            variant={mode === 'amount' ? 'solid' : 'soft'}
                            onClick={() => setMode('amount')}
                        >
                            Amount
                        </Button>
                        <Button
                            type="button"
                            size="1"
                            variant={mode === 'percent' ? 'solid' : 'soft'}
                            onClick={() => setMode('percent')}
                        >
                            Percentage
                        </Button>
                        <Button
                            type="button"
                            size="1"
                            variant={mode === 'split' ? 'solid' : 'soft'}
                            onClick={() => setMode('split')}
                        >
                            Equal payments
                        </Button>
                    </Flex>

                    {mode === 'amount' ? (
                        <Box>
                            <Text as="label" size="1" color="gray">Amount ($)</Text>
                            <TextField.Root
                                type="number"
                                min="0.50"
                                step="0.01"
                                max={balanceDue}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Box>
                    ) : null}

                    {mode === 'percent' ? (
                        <Box>
                            <Flex gap="2" wrap="wrap" mb="2">
                                <Button type="button" size="1" variant="soft" onClick={() => setPercent('25')}>
                                    25%
                                </Button>
                                <Button type="button" size="1" variant="soft" onClick={() => setPercent('50')}>
                                    50%
                                </Button>
                                <Button type="button" size="1" variant="soft" onClick={() => setPercent('100')}>
                                    100%
                                </Button>
                            </Flex>
                            <Text as="label" size="1" color="gray">Percent of invoice total</Text>
                            <TextField.Root
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={percent}
                                onChange={(e) => setPercent(e.target.value)}
                            />
                        </Box>
                    ) : null}

                    {mode === 'split' ? (
                        <Box>
                            <Text as="label" size="1" color="gray">
                                Split invoice total into N equal payments
                            </Text>
                            <TextField.Root
                                type="number"
                                min="2"
                                max="24"
                                step="1"
                                value={splitCount}
                                onChange={(e) => setSplitCount(e.target.value)}
                            />
                            <Text as="div" size="1" color="gray" mt="1">
                                Each payment ≈ ${(invoiceTotal / Math.max(2, Number(splitCount) || 2)).toFixed(2)}
                                {' '}(capped at balance due)
                            </Text>
                        </Box>
                    ) : null}

                    <Button
                        type="button"
                        size="1"
                        variant="ghost"
                        onClick={() => {
                            setShowPartial(false);
                            setError('');
                        }}
                    >
                        Pay full balance instead
                    </Button>
                </Flex>
            ) : (
                <Button
                    type="button"
                    size="1"
                    variant="ghost"
                    onClick={() => {
                        setShowPartial(true);
                        setMode('percent');
                        setPercent('50');
                        setError('');
                    }}
                >
                    Pay a different amount (deposit / partial)
                </Button>
            )}

            <Button
                type="button"
                size="2"
                className="no-print"
                disabled={isPending || chargeAmount == null}
                onClick={startCheckout}
            >
                {isPending
                    ? 'Redirecting…'
                    : `Pay $${(chargeAmount ?? balanceDue).toFixed(2)} with Stripe`}
            </Button>

            {error || preview.error ? (
                <Text as="div" size="1" color="red">
                    {error || preview.error}
                </Text>
            ) : null}

            {note ? (
                <Text as="div" size="1" style={{ color: '#6b7280', lineHeight: 1.35, whiteSpace: 'pre-line' }}>
                    {note}
                </Text>
            ) : null}
        </Flex>
    );
}
