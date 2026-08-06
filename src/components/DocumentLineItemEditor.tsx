'use client';

import { Box, Button, Checkbox, Flex, Grid, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronUp, TrashIcon } from 'lucide-react';
import type { LineItem } from '@/lib/types';
import MarkdownEditor from '@/components/MarkdownEditor';

export function emptyLineItem(): LineItem {
    return {
        id: crypto.randomUUID(),
        description: '',
        details: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        pendingClientApproval: false,
    };
}

export function recalcLineItem(item: LineItem, field: keyof LineItem, value: string | number | boolean): LineItem {
    const updated = { ...item, [field]: value };
    if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent') {
        const gross = Number(updated.quantity) * Number(updated.unitPrice);
        const disc = Math.min(100, Math.max(0, Number(updated.discountPercent) || 0));
        updated.total = gross * (1 - disc / 100);
    }
    return updated;
}

export default function DocumentLineItemEditor({
    item,
    index,
    totalCount,
    namePrefix,
    showPendingApproval,
    unitPriceLabel = 'Price',
    detailsRows = 3,
    onChange,
    onMoveUp,
    onMoveDown,
    onRemove,
    canRemove = true,
}: {
    item: LineItem;
    index: number;
    totalCount: number;
    /** e.g. `items[0]` or `packages[0][items][1]` */
    namePrefix: string;
    showPendingApproval: boolean;
    unitPriceLabel?: string;
    detailsRows?: number;
    onChange: (field: keyof LineItem, value: string | number | boolean) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    canRemove?: boolean;
}) {
    return (
        <Box
            style={{
                border: '1px solid var(--gray-a5)',
                borderRadius: 12,
                padding: 14,
                background: 'var(--gray-a2)',
            }}
        >
            <Flex justify="between" align="center" gap="2" mb="3" wrap="wrap">
                <Text size="2" weight="bold">Item {index + 1}</Text>
                <Flex gap="2" align="center">
                    <Button
                        type="button"
                        size="2"
                        variant="soft"
                        disabled={index === 0}
                        onClick={onMoveUp}
                        style={{ minHeight: 44, minWidth: 44 }}
                        aria-label="Move item up"
                    >
                        <ChevronUp size={18} />
                    </Button>
                    <Button
                        type="button"
                        size="2"
                        variant="soft"
                        disabled={index === totalCount - 1}
                        onClick={onMoveDown}
                        style={{ minHeight: 44, minWidth: 44 }}
                        aria-label="Move item down"
                    >
                        <ChevronDown size={18} />
                    </Button>
                    <Button
                        type="button"
                        size="2"
                        variant="soft"
                        color="red"
                        disabled={!canRemove}
                        onClick={onRemove}
                        style={{ minHeight: 44 }}
                    >
                        <TrashIcon size={16} /> Delete
                    </Button>
                </Flex>
            </Flex>
            <Flex direction="column" gap="3">
                <Box>
                    <Text as="label" size="2">Description</Text>
                    <TextField.Root
                        value={item.description}
                        onChange={(e) => onChange('description', e.target.value)}
                        placeholder="Description"
                    />
                </Box>
                <MarkdownEditor
                    label="Details"
                    value={item.details || ''}
                    onChange={(v) => onChange('details', v)}
                    rows={detailsRows}
                    placeholder="Optional details (markdown supported)"
                />
                <Grid columns={{ initial: '2', sm: '4' }} gap="3">
                    <Box>
                        <Text as="label" size="2">Qty</Text>
                        <TextField.Root
                            type="number"
                            inputMode="decimal"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => {
                                const v = e.target.value;
                                const n = parseFloat(v);
                                onChange('quantity', v === '' ? 0 : Number.isFinite(n) ? Math.max(0, n) : 0);
                            }}
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2">{unitPriceLabel}</Text>
                        <TextField.Root
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                                const v = e.target.value;
                                const n = parseFloat(v);
                                onChange('unitPrice', v === '' ? 0 : Number.isFinite(n) ? Math.max(0, n) : 0);
                            }}
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2">% Off</Text>
                        <TextField.Root
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="1"
                            value={item.discountPercent ?? 0}
                            onChange={(e) => {
                                const v = e.target.value;
                                const n = parseFloat(v);
                                onChange(
                                    'discountPercent',
                                    v === '' ? 0 : Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0,
                                );
                            }}
                        />
                    </Box>
                    <Box>
                        <Text as="label" size="2">Total</Text>
                        <Text as="div" size="3" weight="bold" mt="2">
                            {item.discountPercent ? (
                                <>
                                    <Text as="span" size="1" color="gray" style={{ textDecoration: 'line-through', marginRight: 6 }}>
                                        ${((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toFixed(2)}
                                    </Text>
                                    ${item.total.toFixed(2)}
                                </>
                            ) : (
                                `$${item.total.toFixed(2)}`
                            )}
                        </Text>
                    </Box>
                </Grid>
                {showPendingApproval ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44 }}>
                        <Checkbox
                            checked={item.pendingClientApproval === true}
                            onCheckedChange={(v) => onChange('pendingClientApproval', v === true)}
                        />
                        Needs client approval
                    </label>
                ) : null}
            </Flex>
            <input type="hidden" name={`${namePrefix}[id]`} value={item.id} />
            <input type="hidden" name={`${namePrefix}[description]`} value={item.description} />
            <input type="hidden" name={`${namePrefix}[details]`} value={item.details || ''} />
            <input type="hidden" name={`${namePrefix}[quantity]`} value={item.quantity} />
            <input type="hidden" name={`${namePrefix}[unitPrice]`} value={item.unitPrice} />
            <input type="hidden" name={`${namePrefix}[discountPercent]`} value={item.discountPercent ?? 0} />
            <input
                type="hidden"
                name={`${namePrefix}[pendingClientApproval]`}
                value={showPendingApproval && item.pendingClientApproval ? '1' : '0'}
            />
        </Box>
    );
}
