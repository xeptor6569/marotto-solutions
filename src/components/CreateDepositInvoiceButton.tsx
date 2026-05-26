'use client';

import { useMemo, useState, useTransition } from 'react';
import {
    Box,
    Button,
    Dialog,
    Flex,
    RadioGroup,
    Text,
    TextField,
} from '@radix-ui/themes';
import { FileText } from 'lucide-react';
import { createDepositInvoiceAction } from '@/app/actions';
import { computeDepositAmount, type DepositMode } from '@/lib/deposit-invoice';

export default function CreateDepositInvoiceButton({
    sourceDocumentId,
    billingBase,
    sourceLabel,
}: {
    sourceDocumentId: string;
    billingBase: number;
    sourceLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<DepositMode>('percent');
    const [value, setValue] = useState('50');
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();

    const parsedValue = useMemo(() => {
        const n = parseFloat(value.replace(/,/g, '').trim());
        return Number.isFinite(n) ? n : NaN;
    }, [value]);

    const previewAmount = useMemo(() => {
        if (!Number.isFinite(parsedValue) || billingBase <= 0) return null;
        try {
            return computeDepositAmount(billingBase, mode, parsedValue);
        } catch {
            return null;
        }
    }, [billingBase, mode, parsedValue]);

    const handleCreate = () => {
        setError('');
        startTransition(async () => {
            const result = await createDepositInvoiceAction({
                sourceDocumentId,
                mode,
                value: parsedValue,
            });
            if (!result.success) {
                setError(result.error || 'Could not create deposit invoice.');
                return;
            }
            setOpen(false);
        });
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger>
                <Button variant="soft" size="2">
                    <FileText size={14} aria-hidden />
                    Deposit invoice
                </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="420px">
                <Dialog.Title>Create deposit invoice</Dialog.Title>
                <Dialog.Description size="2" color="gray" mb="3">
                    From {sourceLabel} {sourceDocumentId}. Billing base: ${billingBase.toFixed(2)}
                    {billingBase <= 0 ? ' — add line items to the source document first.' : '.'}
                </Dialog.Description>

                <Flex direction="column" gap="3">
                    <RadioGroup.Root
                        value={mode}
                        onValueChange={(v) => setMode(v as DepositMode)}
                    >
                        <Flex gap="4">
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="percent" />
                                    Percent
                                </Flex>
                            </Text>
                            <Text as="label" size="2">
                                <Flex gap="2" align="center">
                                    <RadioGroup.Item value="fixed" />
                                    Fixed amount
                                </Flex>
                            </Text>
                        </Flex>
                    </RadioGroup.Root>

                    <Box>
                        <Text as="label" size="2" weight="bold">
                            {mode === 'percent' ? 'Percent of billing base' : 'Deposit amount ($)'}
                        </Text>
                        <TextField.Root
                            mt="1"
                            type="number"
                            min={mode === 'percent' ? '0.01' : '0.01'}
                            max={mode === 'percent' ? '100' : undefined}
                            step={mode === 'percent' ? '1' : '0.01'}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={mode === 'percent' ? '50' : billingBase > 0 ? (billingBase / 2).toFixed(2) : '0.00'}
                        />
                    </Box>

                    {previewAmount !== null ? (
                        <Text size="2" color="gray">
                            Invoice total: <Text weight="bold">${previewAmount.toFixed(2)}</Text>
                            {mode === 'percent' && Number.isFinite(parsedValue)
                                ? ` (${parsedValue}% of $${billingBase.toFixed(2)})`
                                : null}
                        </Text>
                    ) : null}

                    {error ? (
                        <Text size="2" color="red">
                            {error}
                        </Text>
                    ) : null}

                    <Flex gap="2" justify="end" mt="2">
                        <Dialog.Close>
                            <Button variant="soft" type="button">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            type="button"
                            onClick={handleCreate}
                            loading={pending}
                            disabled={pending || billingBase <= 0 || previewAmount === null}
                        >
                            Create draft invoice
                        </Button>
                    </Flex>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
