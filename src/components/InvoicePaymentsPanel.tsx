'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    Badge,
    Box,
    Button,
    Callout,
    Card,
    Dialog,
    DropdownMenu,
    Flex,
    Grid,
    Heading,
    Text,
    TextArea,
    TextField,
} from '@radix-ui/themes';
import { CheckCircle2, CreditCard, MoreHorizontal, Plus, Receipt, Trash2, Undo2, XCircle } from 'lucide-react';
import { useMoney } from '@/components/MoneyProvider';
import {
    markInvoicePaidAction,
    recordPaymentAction,
    removePaymentAction,
    reopenInvoiceAction,
    type PaymentActionState,
} from '@/app/admin/payments-actions';
import type { DocumentData, PaymentEntry, PaymentKind } from '@/lib/types';

const initialState: PaymentActionState = { success: false };

const KIND_LABEL: Record<PaymentKind, string> = {
    partial: 'Partial',
    down_payment: 'Down payment',
    final: 'Final',
};

const nativeSelectStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 36,
    padding: '0 10px',
    borderRadius: 'var(--radius-2)',
    border: '1px solid var(--gray-a7)',
    background: 'var(--color-surface)',
    color: 'var(--gray-12)',
    font: 'inherit',
    fontSize: 'var(--font-size-2)',
};

function todayIso(): string {
    return new Date().toISOString().split('T')[0];
}

function RecordPaymentDialog({
    invoiceId,
    balanceDue,
    paymentMethods,
    open,
    onOpenChange,
}: {
    invoiceId: string;
    balanceDue: number;
    paymentMethods: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const { format: money, symbol } = useMoney();
    const [state, formAction, isPending] = useActionState(recordPaymentAction, initialState);
    const [amount, setAmount] = useState(balanceDue.toFixed(2));
    const [kind, setKind] = useState<PaymentKind>('final');

    // Close + refresh once the server confirms; the preview re-renders with
    // the new balance, status, and receipt link.
    useEffect(() => {
        if (state.success) {
            onOpenChange(false);
            router.refresh();
        }
    }, [state, onOpenChange, router]);

    const setFraction = (fraction: number) => {
        const next = Math.round(Math.min(balanceDue, Math.max(0, balanceDue * fraction)) * 100) / 100;
        setAmount(next.toFixed(2));
        setKind(fraction >= 1 ? 'final' : 'partial');
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content style={{ maxWidth: 480 }}>
                <Dialog.Title>Record a payment</Dialog.Title>
                <Dialog.Description size="2" mb="4" color="gray">
                    Balance due {money(balanceDue)}. A receipt is created automatically.
                </Dialog.Description>

                <form action={formAction}>
                    <input type="hidden" name="invoiceId" value={invoiceId} />
                    <Flex direction="column" gap="3">
                        {state.error ? (
                            <Callout.Root color="red" size="1">
                                <Callout.Icon><XCircle size={14} /></Callout.Icon>
                                <Callout.Text>{state.error}</Callout.Text>
                            </Callout.Root>
                        ) : null}

                        <Flex gap="2" wrap="wrap">
                            <Button type="button" size="1" variant="soft" onClick={() => setFraction(0.25)}>25%</Button>
                            <Button type="button" size="1" variant="soft" onClick={() => setFraction(0.5)}>50%</Button>
                            <Button type="button" size="1" variant="soft" onClick={() => setFraction(1)}>Full balance</Button>
                        </Flex>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="bold">Amount</Text>
                                <TextField.Root
                                    name="amount"
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    step="0.01"
                                    max={balanceDue.toFixed(2)}
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    size="3"
                                >
                                    <TextField.Slot>{symbol}</TextField.Slot>
                                </TextField.Root>
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="bold">Date</Text>
                                <TextField.Root name="date" type="date" defaultValue={todayIso()} size="3" />
                            </Flex>
                        </Grid>

                        <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="bold">Method</Text>
                                {paymentMethods.length > 0 ? (
                                    <select name="method" defaultValue="" style={nativeSelectStyle}>
                                        <option value="">Not specified</option>
                                        {paymentMethods.map((label) => (
                                            <option key={label} value={label}>{label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <TextField.Root name="method" placeholder="Cash, check, transfer…" size="3" />
                                )}
                            </Flex>
                            <Flex direction="column" gap="1">
                                <Text as="label" size="2" weight="bold">Type</Text>
                                <select
                                    name="kind"
                                    value={kind}
                                    onChange={(e) => setKind(e.target.value as PaymentKind)}
                                    style={nativeSelectStyle}
                                >
                                    <option value="final">Final payment</option>
                                    <option value="partial">Partial payment</option>
                                    <option value="down_payment">Down payment</option>
                                </select>
                            </Flex>
                        </Grid>

                        <Flex direction="column" gap="1">
                            <Text as="label" size="2" weight="bold">Note (optional)</Text>
                            <TextArea name="notes" rows={2} placeholder="Check #1042, paid on site…" />
                        </Flex>

                        <Flex gap="2" justify="end" mt="2" wrap="wrap">
                            <Dialog.Close>
                                <Button type="button" variant="soft" color="gray" size="3">Cancel</Button>
                            </Dialog.Close>
                            <Button type="submit" size="3" loading={isPending}>
                                <CheckCircle2 size={16} /> Record {money(Number(amount) || 0)}
                            </Button>
                        </Flex>
                    </Flex>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}

function RemovePaymentButton({ invoiceId, payment }: { invoiceId: string; payment: PaymentEntry }) {
    const router = useRouter();
    const { format: money } = useMoney();
    const [state, formAction, isPending] = useActionState(removePaymentAction, initialState);

    useEffect(() => {
        if (state.success) router.refresh();
    }, [state, router]);

    if (payment.stripeSessionId) {
        return (
            <Badge color="violet" variant="soft" title="Recorded by Stripe — refund from the Stripe dashboard">
                Stripe
            </Badge>
        );
    }

    return (
        <AlertDialog.Root>
            <AlertDialog.Trigger>
                <Button type="button" variant="ghost" color="red" size="1" aria-label="Remove payment" style={{ minHeight: 32, minWidth: 32 }}>
                    <Trash2 size={14} />
                </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content style={{ maxWidth: 420 }}>
                <AlertDialog.Title>Remove this payment?</AlertDialog.Title>
                <AlertDialog.Description size="2">
                    The {money(payment.amount)} payment
                    {payment.receiptId ? ` and its receipt ${payment.receiptId}` : ''} will be deleted, and the
                    invoice balance will go back up. Use this to undo a mistaken entry.
                </AlertDialog.Description>
                {state.error ? (
                    <Text size="2" color="red" mt="2" as="p">{state.error}</Text>
                ) : null}
                <form action={formAction}>
                    <input type="hidden" name="invoiceId" value={invoiceId} />
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <Flex gap="3" mt="4" justify="end">
                        <AlertDialog.Cancel>
                            <Button type="button" variant="soft" color="gray">Keep it</Button>
                        </AlertDialog.Cancel>
                        <Button type="submit" color="red" loading={isPending}>Remove payment</Button>
                    </Flex>
                </form>
            </AlertDialog.Content>
        </AlertDialog.Root>
    );
}

function StatusActionForm({
    invoiceId,
    action,
    label,
    icon,
}: {
    invoiceId: string;
    action: typeof markInvoicePaidAction;
    label: string;
    icon: React.ReactNode;
}) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(action, initialState);

    useEffect(() => {
        if (state.success) router.refresh();
    }, [state, router]);

    return (
        <form action={formAction} style={{ display: 'contents' }}>
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <Button type="submit" variant="ghost" color="gray" size="2" loading={isPending} style={{ width: '100%', justifyContent: 'flex-start' }}>
                {icon} {label}
            </Button>
            {state.error ? <Text size="1" color="red">{state.error}</Text> : null}
        </form>
    );
}

export default function InvoicePaymentsPanel({
    invoiceId,
    status,
    total,
    payments,
    paymentMethods,
}: {
    invoiceId: string;
    status: DocumentData['status'];
    total: number;
    payments: PaymentEntry[];
    /** Enabled payment method labels for the method picker. */
    paymentMethods: string[];
}) {
    const { format: money } = useMoney();
    const [recordOpen, setRecordOpen] = useState(false);

    const paidAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const balanceDue = Math.max(0, total - paidAmount);
    const isVoid = status === 'void';
    const markedPaidManually = status === 'paid' && balanceDue > 0;
    const fullyPaid = balanceDue <= 0 && total > 0;

    return (
        <Card className="no-print" mb="4">
            <Flex justify="between" align="start" gap="3" wrap="wrap">
                <Box>
                    <Flex align="center" gap="2" mb="1">
                        <Heading size="3">Payments</Heading>
                        {fullyPaid || status === 'paid' ? (
                            <Badge color="green" variant="soft">Paid</Badge>
                        ) : isVoid ? (
                            <Badge color="gray" variant="soft">Void</Badge>
                        ) : balanceDue < total ? (
                            <Badge color="amber" variant="soft">Partially paid</Badge>
                        ) : (
                            <Badge color="orange" variant="soft">Unpaid</Badge>
                        )}
                    </Flex>
                    <Text as="div" size="6" weight="bold" style={{ color: balanceDue > 0 && !markedPaidManually ? 'var(--red-11)' : 'var(--green-11)', fontVariantNumeric: 'tabular-nums' }}>
                        {money(balanceDue)}
                    </Text>
                    <Text as="div" size="1" color="gray">
                        {markedPaidManually
                            ? `Marked paid with ${money(balanceDue)} unrecorded`
                            : `Balance due · paid ${money(paidAmount)} of ${money(total)}`}
                    </Text>
                </Box>

                <Flex gap="2" align="center" wrap="wrap">
                    {!isVoid && balanceDue > 0 && !markedPaidManually ? (
                        <Button size="3" onClick={() => setRecordOpen(true)} style={{ minHeight: 44 }}>
                            <Plus size={16} /> Record payment
                        </Button>
                    ) : null}
                    {!isVoid && (balanceDue > 0 || markedPaidManually) ? (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Button variant="soft" color="gray" size="3" aria-label="More payment actions" style={{ minHeight: 44, minWidth: 44 }}>
                                    <MoreHorizontal size={16} />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" style={{ minWidth: 260 }}>
                                <Box p="1">
                                    {markedPaidManually ? (
                                        <StatusActionForm
                                            invoiceId={invoiceId}
                                            action={reopenInvoiceAction}
                                            label="Reopen — status follows payments"
                                            icon={<Undo2 size={14} />}
                                        />
                                    ) : (
                                        <StatusActionForm
                                            invoiceId={invoiceId}
                                            action={markInvoicePaidAction}
                                            label="Mark paid without recording a payment"
                                            icon={<CheckCircle2 size={14} />}
                                        />
                                    )}
                                </Box>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    ) : null}
                </Flex>
            </Flex>

            {payments.length > 0 ? (
                <Flex direction="column" mt="4" style={{ borderTop: '1px solid var(--gray-a5)' }}>
                    {[...payments].sort((a, b) => b.date.localeCompare(a.date)).map((payment) => (
                        <Flex
                            key={payment.id}
                            justify="between"
                            align="center"
                            gap="3"
                            py="2"
                            style={{ borderBottom: '1px solid var(--gray-a3)' }}
                        >
                            <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                                <Box style={{ color: 'var(--green-9)', flexShrink: 0 }}>
                                    <CreditCard size={16} />
                                </Box>
                                <Box style={{ minWidth: 0 }}>
                                    <Text as="div" size="2" weight="bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {money(payment.amount)}
                                        <Text size="1" color="gray" weight="regular"> · {KIND_LABEL[payment.kind] ?? payment.kind}</Text>
                                    </Text>
                                    <Text as="div" size="1" color="gray" truncate>
                                        {new Date(payment.date).toLocaleDateString()}
                                        {payment.method ? ` · ${payment.method}` : ''}
                                        {payment.notes ? ` · ${payment.notes}` : ''}
                                    </Text>
                                </Box>
                            </Flex>
                            <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
                                {payment.receiptId ? (
                                    <Button asChild variant="ghost" size="1" style={{ minHeight: 32 }}>
                                        <Link href={`/admin/receipts/${payment.receiptId}`}>
                                            <Receipt size={14} /> {payment.receiptId}
                                        </Link>
                                    </Button>
                                ) : null}
                                <RemovePaymentButton invoiceId={invoiceId} payment={payment} />
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            ) : (
                <Text as="p" size="2" color="gray" mt="3">
                    {isVoid
                        ? 'This invoice is void.'
                        : markedPaidManually
                            ? 'No payments recorded — this invoice was marked paid manually.'
                            : 'No payments recorded yet.'}
                </Text>
            )}

            <RecordPaymentDialog
                key={`${invoiceId}-${balanceDue}`}
                invoiceId={invoiceId}
                balanceDue={balanceDue}
                paymentMethods={paymentMethods}
                open={recordOpen}
                onOpenChange={setRecordOpen}
            />
        </Card>
    );
}
