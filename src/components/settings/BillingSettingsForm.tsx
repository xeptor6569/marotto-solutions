'use client';

import { useState } from 'react';
import { Box, Button, Card, Flex, Grid, Text, TextArea, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SettingsSectionForm, { Field } from './SettingsSectionForm';
import type { AppConfig, PaymentMethodKey } from '@/lib/types';

const ALL_METHOD_KEYS: PaymentMethodKey[] = ['cash', 'check', 'zelle', 'cashApp', 'paypal', 'venmo', 'applePay', 'stripe'];

const paymentMethodFields: Record<PaymentMethodKey, { valueLabel: string; noteLabel: string }> = {
    cash: { valueLabel: 'Label Override', noteLabel: 'Cash Note' },
    check: { valueLabel: 'Payable To', noteLabel: 'Check Note' },
    zelle: { valueLabel: 'Zelle Handle', noteLabel: 'Zelle Note' },
    cashApp: { valueLabel: 'Cash App Handle', noteLabel: 'Cash App Note' },
    paypal: { valueLabel: 'PayPal Link / Handle', noteLabel: 'PayPal Note' },
    venmo: { valueLabel: 'Venmo Handle', noteLabel: 'Venmo Note' },
    applePay: { valueLabel: 'Apple Pay Number / Email', noteLabel: 'Apple Pay Note' },
    stripe: {
        valueLabel: 'Fallback Stripe Link (optional)',
        noteLabel: 'Stripe Note',
    },
};

function initialMethodOrder(config: Partial<AppConfig>): PaymentMethodKey[] {
    const methods = config.billing?.paymentMethods;
    return [...ALL_METHOD_KEYS].sort((a, b) => {
        const pa = methods?.[a]?.position ?? ALL_METHOD_KEYS.indexOf(a);
        const pb = methods?.[b]?.position ?? ALL_METHOD_KEYS.indexOf(b);
        return pa - pb;
    });
}

export default function BillingSettingsForm({ config }: { config: Partial<AppConfig> }) {
    const [order, setOrder] = useState<PaymentMethodKey[]>(() => initialMethodOrder(config));

    const moveMethod = (index: number, direction: -1 | 1) => {
        setOrder((prev) => {
            const target = index + direction;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    return (
        <SettingsSectionForm section="billing">
            <Field label="Checks Payable To">
                <TextField.Root
                    name="checkPayableTo"
                    defaultValue={config.billing?.checkPayableTo || ''}
                    placeholder="Your business name"
                />
            </Field>
            <Field label="General Payment Instructions">
                <TextArea
                    name="paymentInstructions"
                    defaultValue={config.billing?.paymentInstructions || ''}
                    placeholder="Payment is due by the listed due date. Please include the invoice number with your payment."
                    rows={4}
                />
            </Field>

            <Box>
                <Text size="3" weight="bold" as="div">Payment Methods</Text>
                <Text as="p" size="2" color="gray" mt="1">
                    Use the arrows to set the order methods appear on invoices. Disabled methods are hidden from clients.
                </Text>
            </Box>
            <input type="hidden" name="paymentMethodOrder" value={order.join(',')} readOnly />
            <Grid columns={{ initial: '1', md: '2' }} gap="3">
                {order.map((key, index) => {
                    const { valueLabel, noteLabel } = paymentMethodFields[key];
                    const method = config.billing?.paymentMethods?.[key];
                    return (
                        <Card key={key} variant="surface">
                            <Flex direction="column" gap="3">
                                <Flex justify="between" align="center" gap="2">
                                    <Flex align="center" gap="2">
                                        <Flex direction="column">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="1"
                                                disabled={index === 0}
                                                onClick={() => moveMethod(index, -1)}
                                                aria-label={`Move ${method?.label || key} up`}
                                            >
                                                <ChevronUp size={16} />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="1"
                                                disabled={index === order.length - 1}
                                                onClick={() => moveMethod(index, 1)}
                                                aria-label={`Move ${method?.label || key} down`}
                                            >
                                                <ChevronDown size={16} />
                                            </Button>
                                        </Flex>
                                        <Text size="3" weight="bold">{method?.label || key}</Text>
                                        <Text size="1" color="gray">#{index + 1}</Text>
                                    </Flex>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44, cursor: 'pointer' }}>
                                        <input type="checkbox" name={`billing.${key}.enabled`} defaultChecked={method?.enabled ?? true} />
                                        Enabled
                                    </label>
                                </Flex>
                                <Box>
                                    <Text as="label" size="2" weight="bold">{valueLabel}</Text>
                                    {key === 'stripe' ? (
                                        <Text size="1" color="gray" as="p" mb="1">
                                            Preferred: set <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> in the server env for Checkout + auto-recorded payments. Optional pasteable Payment Link is only a fallback when Checkout is not configured.
                                        </Text>
                                    ) : null}
                                    <TextField.Root
                                        name={`billing.${key}.value`}
                                        defaultValue={method?.value || ''}
                                        placeholder={
                                            key === 'check'
                                                ? config.billing?.checkPayableTo || 'Your business name'
                                                : key === 'stripe'
                                                    ? 'https://buy.stripe.com/... (fallback only)'
                                                    : ''
                                        }
                                    />
                                </Box>
                                <Box>
                                    <Text as="label" size="2" weight="bold">{noteLabel}</Text>
                                    <TextArea
                                        name={`billing.${key}.note`}
                                        defaultValue={method?.note || ''}
                                        placeholder="Optional note shown under this payment method."
                                        rows={3}
                                    />
                                </Box>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, minHeight: 44, cursor: 'pointer' }}>
                                    <input type="checkbox" name={`billing.${key}.comingSoon`} defaultChecked={method?.comingSoon ?? false} />
                                    Mark as coming soon
                                </label>
                            </Flex>
                        </Card>
                    );
                })}
            </Grid>
        </SettingsSectionForm>
    );
}
